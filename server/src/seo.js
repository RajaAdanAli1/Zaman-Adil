import { Article, Publication } from "./models.js";
import { presentArticle, presentPublication } from "./present.js";
import { areas, expertise, interests, nav, services } from "../../client/src/content.js";
import {
  ORIGIN,
  PAGES,
  PROFILE,
  articleNode,
  breadcrumbNode,
  clip,
  documentTitle,
  itemListNode,
  pageGraph,
  scholarlyNode,
} from "../../shared/seo.js";

const ABOUT = [
  "Dr. Adil Zaman is a political scientist, researcher and academic specialising in elections, political behaviour, democratic institutions and South Asian politics.",
  "He serves as a faculty member in the Department of Political Science and International Relations at the University of Gujrat, Pakistan, where he has been associated with teaching, research and academic supervision since 2014.",
  "His academic work combines political analysis with empirical research, including survey research, electoral data analysis and comparative approaches.",
  "A major strand of his research examines electoral integrity, electoral campaigns, voting behaviour, political participation and democratic institutions in Pakistan and South Asia.",
];

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonScript(value) {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

export function headBlock(meta) {
  const title = documentTitle(meta.title);
  const description = clip(meta.description);
  const url = `${ORIGIN}${meta.path === "/" ? "/" : meta.path}`;
  const image = meta.image && /^https?:\/\//i.test(meta.image) ? meta.image : `${ORIGIN}${meta.image || PROFILE.imagePath}`;
  const robots = meta.robots || "index, follow";
  const locale = meta.lang === "ur" ? "ur_PK" : "en_US";
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="author" content="${escapeHtml(PROFILE.name)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(PROFILE.name)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType || "website")}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:locale" content="${locale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json" id="seo-jsonld">${jsonScript(meta.jsonLd)}</script>`,
  ].join("\n    ");
}

function shell(main) {
  const links = nav
    .map(([href, label]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`)
    .join(" ");
  return `<nav>${links}</nav><main>${main}</main>`;
}

function paragraphs(items) {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function linkList(items) {
  return `<ul>${items.map(([href, text]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></li>`).join("")}</ul>`;
}

function notFound(path) {
  const page = {
    title: "Page not found",
    description: "The requested page is not available on zamanadil.com.",
    path,
    robots: "noindex, follow",
  };
  return {
    status: 404,
    robotsHeader: "noindex, follow",
    lang: "en",
    meta: { ...page, jsonLd: pageGraph(page) },
    bootstrap: { path, missing: true },
    noscript: shell(`<h1>This page could not be found.</h1><p><a href="/">Return home</a></p>`),
  };
}

function ready({ status = 200, robotsHeader, lang = "en", meta, bootstrap, noscript }) {
  return {
    status,
    robotsHeader: robotsHeader || meta.robots || "index, follow",
    lang,
    meta: { ...meta, jsonLd: meta.jsonLd || pageGraph(meta) },
    bootstrap,
    noscript,
  };
}

export async function resolveDocument(urlPath) {
  let path = "/";
  try {
    path = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  } catch {
    path = "/";
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path.startsWith("/")) path = `/${path}`;

  if (path.startsWith("/admin")) {
    const meta = {
      title: "Research desk",
      description: "Private archive desk.",
      path,
      robots: "noindex, nofollow",
    };
    return ready({
      robotsHeader: "noindex, nofollow",
      meta,
      bootstrap: { path },
      noscript: "",
    });
  }

  if (path === "/search") {
    const meta = {
      title: "Search",
      description: "Search publications, research reviews and opinion on zamanadil.com.",
      path,
      robots: "noindex, nofollow",
    };
    return ready({ meta, bootstrap: { path }, noscript: shell(`<h1>Search</h1>`) });
  }

  if (path === "/") return homeDocument();
  if (path === "/publications") return publicationsDocument();
  if (path === "/research-reviews") return archiveDocument("review");
  if (path === "/opinion-blogs") return archiveDocument("opinion");

  const publication = path.match(/^\/publications\/([^/]+)$/);
  if (publication) return publicationDocument(publication[1]);

  const review = path.match(/^\/research-reviews\/([^/]+)$/);
  if (review) return articleDocument(review[1], "review");

  const opinion = path.match(/^\/opinion-blogs\/([^/]+)$/);
  if (opinion) return articleDocument(opinion[1], "opinion");

  if (PAGES[path]) return staticDocument(path);
  return notFound(path);
}

async function homeDocument() {
  const page = PAGES["/"];
  const [featured, reviews, opinions] = await Promise.all([
    Publication.find({ featured: true }).sort({ year: -1 }),
    Article.find({ kind: "review", published: true }).sort({ date: -1 }).limit(3),
    Article.find({ kind: "opinion", published: true }).sort({ date: -1 }).limit(3),
  ]);
  const data = {
    path: "/",
    featured: featured.map(presentPublication),
    reviews: reviews.map((item) => presentArticle(item)),
    opinions: opinions.map((item) => presentArticle(item)),
  };
  const main = [
    `<h1>${escapeHtml(PROFILE.name)}</h1>`,
    `<p>${escapeHtml("Political scientist at the University of Gujrat. Researching elections, political behaviour, democratic institutions and the changing politics of Pakistan and South Asia.")}</p>`,
    `<h2>Research areas</h2>`,
    linkList(areas.map(([title]) => ["/expertise", title])),
    `<h2>Featured research</h2>`,
    linkList(data.featured.map((item) => [`/publications/${item.id}`, item.title])),
    `<h2>Research reviews</h2>`,
    linkList(data.reviews.map((item) => [`/research-reviews/${item.slug}`, item.title])),
    `<h2>Opinion and blogs</h2>`,
    linkList(data.opinions.map((item) => [`/opinion-blogs/${item.slug}`, item.title])),
  ].join("");
  return ready({
    meta: { ...page, path: "/" },
    bootstrap: data,
    noscript: shell(main),
  });
}

async function publicationsDocument() {
  const page = PAGES["/publications"];
  const items = await Publication.find().sort({ year: -1, title: 1 });
  const presented = items.map(presentPublication);
  const years = [...new Set(presented.map((item) => item.year))].sort((a, b) => b - a);
  const types = [...new Set(presented.map((item) => item.type))];
  const meta = {
    ...page,
    path: "/publications",
    jsonLd: pageGraph({
      ...page,
      path: "/publications",
      extra: [itemListNode(presented, (item) => `/publications/${item.id}`)],
    }),
  };
  return ready({
    meta,
    bootstrap: { path: "/publications", items: presented, years, types },
    noscript: shell(
      `<h1>Publications</h1><p>${escapeHtml(page.description)}</p>${linkList(
        presented.map((item) => [`/publications/${item.id}`, `${item.year} — ${item.title}`])
      )}`
    ),
  });
}

async function publicationDocument(slug) {
  const doc = await Publication.findOne({ slug });
  if (!doc) return notFound(`/publications/${slug}`);
  const item = presentPublication(doc);
  const path = `/publications/${item.id}`;
  const description = clip(item.summary || `${item.authors}. ${item.venue} (${item.year}).`);
  const meta = {
    title: item.title,
    description,
    path,
    robots: "index, follow",
    ogType: "article",
    jsonLd: pageGraph({
      title: item.title,
      description,
      path,
      extra: [
        scholarlyNode(item),
        breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "Publications", path: "/publications" },
          { name: item.title, path },
        ]),
      ],
    }),
  };
  const source = item.link || item.url;
  const main = [
    `<h1>${escapeHtml(item.title)}</h1>`,
    `<p>${escapeHtml(item.authors)}. ${escapeHtml(item.venue)} (${escapeHtml(item.year)}).</p>`,
    item.summary ? `<p>${escapeHtml(item.summary)}</p>` : "",
    source ? `<p><a href="${escapeHtml(source)}">Publisher record</a></p>` : "",
    `<p><a href="/publications">All publications</a></p>`,
  ].join("");
  return ready({
    meta,
    bootstrap: { path, item },
    noscript: shell(main),
  });
}

async function archiveDocument(kind) {
  const path = kind === "review" ? "/research-reviews" : "/opinion-blogs";
  const page = PAGES[path];
  const items = await Article.find({ kind, published: true }).sort({ date: -1 });
  const presented = items.map((item) => presentArticle(item));
  const categories = [...new Set(presented.map((item) => item.category).filter(Boolean))].sort();
  const meta = {
    ...page,
    path,
    jsonLd: pageGraph({
      ...page,
      path,
      extra: [itemListNode(presented, (item) => `${path}/${item.slug}`)],
    }),
  };
  return ready({
    meta,
    bootstrap: { path, items: presented, categories },
    noscript: shell(
      `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>${linkList(
        presented.map((item) => [`${path}/${item.slug}`, item.title])
      )}`
    ),
  });
}

async function articleDocument(slug, kind) {
  const base = kind === "review" ? "/research-reviews" : "/opinion-blogs";
  const label = kind === "review" ? "Research Reviews" : "Opinion & Blogs";
  const doc = await Article.findOne({ slug, kind, published: true });
  if (!doc) return notFound(`${base}/${slug}`);
  const article = presentArticle(doc, true);
  const relatedDocs = await Article.find({ kind, published: true, slug: { $ne: article.slug } }).sort({ date: -1 }).limit(3);
  const related = relatedDocs.map((item) => presentArticle(item));
  const path = `${base}/${article.slug}`;
  const description = clip(article.excerpt || article.subtitle || article.title);
  const meta = {
    title: article.title,
    description,
    path,
    robots: "index, follow",
    image: article.image,
    lang: article.lang === "ur" ? "ur" : "en",
    ogType: "article",
    jsonLd: pageGraph({
      title: article.title,
      description,
      path,
      extra: [
        articleNode(article, path),
        breadcrumbNode([
          { name: "Home", path: "/" },
          { name: label, path: base },
          { name: article.title, path },
        ]),
      ],
    }),
  };
  const body = [
    ...(article.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ...(article.sections || []).flatMap((section) => [
      `<h2>${escapeHtml(section.heading)}</h2>`,
      ...(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ]),
  ].join("");
  return ready({
    lang: meta.lang,
    meta,
    bootstrap: { path, article, related },
    noscript: shell(`<article><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.author)}</p>${body}</article>`),
  });
}

function staticDocument(path) {
  const page = PAGES[path];
  const meta = { ...page, path };
  let main = `<h1>${escapeHtml(page.title)}</h1>${paragraphs([page.description])}`;
  if (path === "/about") {
    main = `<h1>About Dr. Adil Zaman</h1>${paragraphs(ABOUT)}<p>Research interests: ${escapeHtml(interests.join(", "))}.</p>`;
  } else if (path === "/expertise") {
    main = `<h1>Research Expertise</h1>${expertise
      .map(([title, text]) => `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>`)
      .join("")}`;
  } else if (path === "/services") {
    main = `<h1>Research &amp; Academic Services</h1>${services
      .map(([, title, texts]) => `<h2>${escapeHtml(title)}</h2>${paragraphs(texts)}`)
      .join("")}`;
  } else if (path === "/contact") {
    main = `<h1>Contact</h1>${paragraphs([page.description, `${PROFILE.email}`])}<p><a href="mailto:${escapeHtml(PROFILE.email)}">${escapeHtml(PROFILE.email)}</a></p>`;
  }
  return ready({ meta, bootstrap: { path }, noscript: shell(main) });
}

export function applyTemplate(template, document) {
  const head = headBlock({ ...document.meta, lang: document.lang });
  const bootstrap = jsonScript(document.bootstrap || {});
  const noscript = document.noscript ? `<noscript>${document.noscript}</noscript>` : "";
  let html = template.replace(/<html lang="[^"]*">/i, `<html lang="${document.lang === "ur" ? "ur" : "en"}">`);
  if (html.includes("<!--seo-head-->") && html.includes("<!--/seo-head-->")) {
    html = html.replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, `<!--seo-head-->\n    ${head}\n    <!--/seo-head-->`);
  }
  html = html.replace(
    /<script type="application\/json" id="bootstrap">[\s\S]*?<\/script>/,
    `<script type="application/json" id="bootstrap">${bootstrap}</script>`
  );
  if (html.includes("<!--seo-noscript-->")) {
    html = html.replace("<!--seo-noscript-->", noscript);
  }
  return html;
}

function xml(value) {
  return escapeHtml(value);
}

export async function sitemapXml() {
  const [publications, articles] = await Promise.all([
    Publication.find().select("slug updatedAt").lean(),
    Article.find({ published: true }).select("slug kind updatedAt").lean(),
  ]);
  const urls = [
    ...Object.keys(PAGES).map((path) => ({ path, updated: null })),
    ...publications.map((item) => ({ path: `/publications/${item.slug}`, updated: item.updatedAt })),
    ...articles.map((item) => ({
      path: `${item.kind === "review" ? "/research-reviews" : "/opinion-blogs"}/${item.slug}`,
      updated: item.updatedAt,
    })),
  ];
  const body = urls
    .map((item) => {
      const lastmod = item.updated ? `<lastmod>${new Date(item.updated).toISOString().slice(0, 10)}</lastmod>` : "";
      return `<url><loc>${xml(`${ORIGIN}${item.path === "/" ? "/" : item.path}`)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`;
}

export function robotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /search",
    "",
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}
