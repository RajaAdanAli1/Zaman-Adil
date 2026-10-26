import { Router } from "express";
import { enquiries } from "../../../client/src/content.js";
import { Article, Publication, Message, Pageview } from "../models.js";
import { canonicalLink } from "../seed.js";
import { toBibtex } from "../bibtex.js";
import { presentAlt, presentArticle, presentPublication } from "../present.js";
import { limitStatus, recordLimit } from "../limit.js";
import { clientAddress, hashAddress } from "../security.js";
import { dayKey, incrementPageview, normalizeTrackPath } from "../pageviews.js";
import { sendContactEmail } from "../mail.js";
import { ARTICLE_KINDS } from "../../../shared/catalog.js";
import { isSlug } from "../../../shared/links.js";
import { translateTexts, translationRequest } from "../translate.js";

const router = Router();
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW = 10 * 60 * 1000;
const TRACK_LIMIT = 60;
const TRACK_WINDOW = 60 * 1000;
const TRANSLATE_LIMIT = 60;
const TRANSLATE_WINDOW = 10 * 60 * 1000;
const LIST_LIMIT = 500;

const CONSENT = new Set(["1", "true", "on", "yes"]);

function bounded(value, max, { required = false } = {}) {
  if (typeof value !== "string") return { error: "Please complete the required fields." };
  const trimmed = value.replace(/\u0000/g, "").trim();
  if (!trimmed) return required ? { error: "Please complete the required fields." } : { value: "" };
  if (trimmed.length > max) return { error: "One of the fields is too long." };
  return { value: trimmed };
}

router.get("/home", async (_req, res, next) => {
  try {
    const [featured, reviews, opinions] = await Promise.all([
      Publication.find({ featured: true }).sort({ year: -1, title: 1 }).limit(12),
      Article.find({ kind: "review", published: true }).sort({ date: -1 }).limit(3),
      Article.find({ kind: "opinion", published: true }).sort({ date: -1 }).limit(3),
    ]);
    res.json({
      featured: featured.map(presentPublication),
      reviews: reviews.map((item) => presentArticle(item)),
      opinions: opinions.map((item) => presentArticle(item)),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/publications/bibtex", async (_req, res, next) => {
  try {
    const items = await Publication.find().sort({ year: -1, title: 1 }).limit(LIST_LIMIT);
    res.setHeader("Content-Type", "application/x-bibtex; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"zaman-adil.bib\"");
    res.send(toBibtex(items));
  } catch (error) {
    next(error);
  }
});

router.get("/publications/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    if (!isSlug(slug)) return res.status(404).json({ error: "Publication not found." });
    const item = await Publication.findOne({ slug });
    if (!item) return res.status(404).json({ error: "Publication not found." });
    res.json({ item: presentPublication(item) });
  } catch (error) {
    next(error);
  }
});

router.get("/publications", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.year != null && req.query.year !== "") {
      if (typeof req.query.year !== "string" || !/^\d{4}$/.test(req.query.year)) {
        return res.status(400).json({ error: "The year filter is not valid." });
      }
      filter.year = Number(req.query.year);
    }
    if (req.query.type != null && req.query.type !== "") {
      if (typeof req.query.type !== "string" || req.query.type.length > 80) {
        return res.status(400).json({ error: "The type filter is not valid." });
      }
      filter.type = req.query.type;
    }
    const items = await Publication.find(filter).sort({ year: -1, title: 1 }).limit(LIST_LIMIT);
    const years = await Publication.distinct("year");
    const types = await Publication.distinct("type");
    res.json({
      items: items.map(presentPublication),
      years: years.filter((year) => Number.isInteger(year)).sort((a, b) => b - a),
      types: types.filter((type) => typeof type === "string" && type).sort(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/articles", async (req, res, next) => {
  try {
    const filter = { published: true };
    if (req.query.kind != null && req.query.kind !== "") {
      if (typeof req.query.kind !== "string" || !ARTICLE_KINDS.includes(req.query.kind)) {
        return res.status(400).json({ error: "Unknown article kind." });
      }
      filter.kind = req.query.kind;
    }
    if (req.query.category != null && req.query.category !== "") {
      if (typeof req.query.category !== "string" || req.query.category.trim().length > 80) {
        return res.status(400).json({ error: "The category filter is not valid." });
      }
      filter.category = req.query.category.trim();
    }
    const items = await Article.find(filter).sort({ date: -1 }).limit(LIST_LIMIT);
    const categoryFilter = { published: true };
    if (filter.kind) categoryFilter.kind = filter.kind;
    const categories = await Article.distinct("category", categoryFilter);
    res.json({
      items: items.map((item) => presentArticle(item)),
      categories: categories.filter((category) => typeof category === "string" && category).sort(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    if (!isSlug(slug)) return res.status(404).json({ error: "Article not found." });
    const filter = { slug, published: true };
    if (req.query.kind != null && req.query.kind !== "") {
      if (typeof req.query.kind !== "string" || !ARTICLE_KINDS.includes(req.query.kind)) {
        return res.status(400).json({ error: "Unknown article kind." });
      }
      filter.kind = req.query.kind;
    }
    const article = await Article.findOne(filter);
    if (!article) return res.status(404).json({ error: "Article not found." });
    const related = await Article.find({
      kind: article.kind,
      published: true,
      slug: { $ne: article.slug },
    }).sort({ date: -1 }).limit(3);
    res.json({
      article: presentArticle(article, true),
      related: related.map((item) => presentArticle(item)),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    if (req.query.q != null && typeof req.query.q !== "string") {
      return res.status(400).json({ error: "Search text must be plain text." });
    }
    const q = String(req.query.q || "").trim().replace(/\u0000/g, "");
    if (q.length > 120) return res.status(400).json({ error: "That search is too long." });
    if (q.length < 2) return res.json({ query: q, results: [] });
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [publications, articles] = await Promise.all([
      Publication.find({
        $or: [
          { title: pattern },
          { authors: pattern },
          { venue: pattern },
          { summary: pattern },
          { "alt.title": pattern },
          { "alt.summary": pattern },
        ],
      }).limit(12),
      Article.find({
        published: true,
        $or: [
          { title: pattern },
          { category: pattern },
          { paragraphs: pattern },
          { "sections.paragraphs": pattern },
          { "alt.title": pattern },
          { "alt.paragraphs": pattern },
          { "alt.sections.paragraphs": pattern },
        ],
      }).limit(12),
    ]);
    const pages = [
      ["About", "/about", "Profile of Dr. Adil Zaman"],
      ["Research Expertise", "/expertise", "Elections, political behaviour, Pakistan and South Asia"],
      ["Publications", "/publications", "Journal articles and scholarly work"],
      ["Research Reviews", "/research-reviews", "Reviews of academic studies"],
      ["Opinion & Blogs", "/opinion-blogs", "Evidence-informed commentary"],
      ["Services", "/services", "Research design, analysis and consultancy"],
      ["Contact", "/contact", "Academic and professional enquiries"],
    ]
      .filter((page) => pattern.test(page.join(" ")))
      .map(([title, href, summary]) => ({ type: "Page", title, href, summary }));

    res.json({
      query: q,
      results: [
        ...pages,
        ...publications.map((item) => ({
          type: "Publication",
          title: item.title,
          href: `/publications/${item.slug}`,
          summary: `${item.year} · ${item.venue}`,
          link: canonicalLink(item),
          lang: item.lang === "ur" ? "ur" : "en",
          alt: presentAlt(item.alt, true),
        })),
        ...articles.map((item) => ({
          type: item.kind === "review" ? "Research Review" : "Opinion",
          title: item.title,
          href: `${item.kind === "review" ? "/research-reviews" : "/opinion-blogs"}/${item.slug}`,
          summary: item.category,
          lang: item.lang === "ur" ? "ur" : "en",
          kind: item.kind,
          alt: presentAlt(item.alt, true, { article: true }),
        })),
      ],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/translate", async (req, res, next) => {
  try {
    const parsed = translationRequest(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const ipHash = hashAddress(clientAddress(req));
    const status = limitStatus(`translate:${ipHash}`, { limit: TRANSLATE_LIMIT, windowMs: TRANSLATE_WINDOW });
    if (status.limited) {
      res.setHeader("Retry-After", String(status.retryAfter));
      return res.status(429).json({ error: "Please wait a few minutes before translating more text." });
    }
    recordLimit(`translate:${ipHash}`, { windowMs: TRANSLATE_WINDOW });
    const translated = await translateTexts(parsed.value);
    res.json(translated);
  } catch (error) {
    next(error);
  }
});

router.post("/contact", async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "The request body must be an object." });
    }
    if (body.website != null && String(body.website).trim() !== "") return res.json({ ok: true });

    const name = bounded(body.name, 120, { required: true });
    const email = bounded(body.email, 180, { required: true });
    const subject = bounded(body.subject, 180, { required: true });
    const message = bounded(body.message, 5000, { required: true });
    const organisation = bounded(body.organisation ?? "", 180);
    const country = bounded(body.country ?? "", 80);
    const fieldError = [name, email, subject, message, organisation, country].find((item) => item.error);
    if (fieldError) return res.status(400).json({ error: fieldError.error });
    if (typeof body.enquiry !== "string" || !enquiries.includes(body.enquiry)) {
      return res.status(400).json({ error: "Select a nature of enquiry." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    const consent = body.consent === true ? "true" : typeof body.consent === "string" ? body.consent.trim().toLowerCase() : "";
    if (!CONSENT.has(consent)) return res.status(400).json({ error: "Please complete the required fields." });

    const ipHash = hashAddress(clientAddress(req));
    const status = limitStatus(`contact:${ipHash}`, { limit: CONTACT_LIMIT, windowMs: CONTACT_WINDOW });
    if (status.limited) {
      res.setHeader("Retry-After", String(status.retryAfter));
      return res.status(429).json({ error: "Please wait a few minutes before sending another message." });
    }
    recordLimit(`contact:${ipHash}`, { windowMs: CONTACT_WINDOW });

    const saved = {
      name: name.value,
      email: email.value,
      organisation: organisation.value,
      country: country.value,
      enquiry: body.enquiry,
      subject: subject.value,
      message: message.value,
    };
    await Message.create({ ...saved, ipHash });
    try {
      await sendContactEmail(saved);
    } catch (error) {
      console.error("Contact email failed:", error?.message || "send failed");
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/track", async (req, res, next) => {
  try {
    const pathName = normalizeTrackPath(req.body?.path);
    if (!pathName) return res.status(400).json({ error: "That page cannot be counted." });
    const ipHash = hashAddress(clientAddress(req));
    const status = limitStatus(`track:${ipHash}`, { limit: TRACK_LIMIT, windowMs: TRACK_WINDOW });
    if (status.limited) {
      res.setHeader("Retry-After", String(status.retryAfter));
      return res.status(429).json({ error: "Too many page counts from this connection." });
    }
    recordLimit(`track:${ipHash}`, { windowMs: TRACK_WINDOW });
    await incrementPageview(Pageview, pathName, dayKey());
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
