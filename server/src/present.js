import { bareDoi, httpUrl, safeHref } from "../../shared/links.js";
import { READING_LANGS } from "../../shared/catalog.js";
import { readingMinutes } from "../../shared/reading.js";
import { canonicalLink } from "./seed.js";

export function presentAlt(alt, full = false, { article = false } = {}) {
  if (!alt || typeof alt !== "object" || !READING_LANGS.includes(alt.lang) || !String(alt.title || "").trim()) return null;
  const hasBody = (alt.paragraphs || []).some(Boolean)
    || (alt.sections || []).some((section) => (section.paragraphs || []).some(Boolean));
  if (article && !hasBody) return null;
  const excerptSource = alt.paragraphs?.[0] || alt.sections?.[0]?.paragraphs?.[0] || alt.summary || "";
  const base = {
    lang: alt.lang,
    title: alt.title,
    subtitle: alt.subtitle || "",
    summary: alt.summary || "",
    excerpt: String(excerptSource).slice(0, 220).trim(),
    ready: true,
  };
  if (!full) return base;
  return {
    ...base,
    citation: alt.citation || "",
    paragraphs: alt.paragraphs || [],
    sections: alt.sections || [],
  };
}

export function presentPublication(doc) {
  const item = doc.toObject ? doc.toObject() : doc;
  const link = canonicalLink(item);
  return {
    id: item.slug,
    title: item.title,
    authors: item.authors,
    year: item.year,
    venue: item.venue,
    type: item.type,
    volume: item.volume || "",
    issue: item.issue || "",
    pages: item.pages || "",
    doi: bareDoi(item.doi),
    url: httpUrl(item.url),
    pdf: httpUrl(item.pdf),
    summary: item.summary || "",
    featured: Boolean(item.featured),
    verified: Boolean(link),
    link,
    lang: item.lang === "ur" ? "ur" : "en",
    alt: presentAlt(item.alt, true),
  };
}

export function presentArticle(doc, full = false) {
  const item = doc.toObject ? doc.toObject() : doc;
  const excerptSource = item.paragraphs?.[0] || item.sections?.[0]?.paragraphs?.[0] || "";
  const lang = item.lang === "ur" ? "ur" : "en";
  const base = {
    slug: item.slug,
    kind: item.kind,
    title: item.title,
    subtitle: item.subtitle || "",
    date: item.date,
    category: item.category,
    image: safeHref(item.image),
    imageAlt: item.imageAlt || "",
    author: item.author,
    lang,
    excerpt: excerptSource.slice(0, 220).trim(),
    readingMinutes: readingMinutes({ lang, paragraphs: item.paragraphs, sections: item.sections }),
    alt: presentAlt(item.alt, full, { article: true }),
  };
  if (!full) return base;
  return {
    ...base,
    citation: item.citation || "",
    doi: bareDoi(item.doi),
    paragraphs: item.paragraphs || [],
    sections: item.sections || [],
  };
}
