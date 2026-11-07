import { Article, Project, Publication } from "./models.js";
import { presentArticle, presentPublication } from "./present.js";
import { ISSUED as LEGAL_ISSUED, PROPRIETOR as LEGAL_PROPRIETOR, instruments as legalInstruments } from "../../client/src/legalDocuments.js";
import { areas, expertise, homeServices, interests, nav, services } from "../../client/src/content.js";
import {
  ORIGIN,
  PAGES,
  PROFILE,
  alternateLocales,
  articleNode,
  breadcrumbNode,
  clip,
  contentLanguages,
  documentTitle,
  itemListNode,
  localeFor,
  pageGraph,
  scholarlyNode,
  socialFields,
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
  const canonical = `${ORIGIN}${(meta.canonicalPath || meta.path) === "/" ? "/" : (meta.canonicalPath || meta.path)}`;
  const image = socialFields(meta.image, meta.imageAlt);
  const robots = meta.robots || "index, follow";
  const locale = localeFor(meta.lang);
  const alternates = alternateLocales(meta.lang, meta.languages);
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="author" content="${escapeHtml(PROFILE.name)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(PROFILE.name)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType || "website")}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image.url)}" />`,
  ];
  if (image.secureUrl) tags.push(`<meta property="og:image:secure_url" content="${escapeHtml(image.secureUrl)}" />`);
  if (image.type) tags.push(`<meta property="og:image:type" content="${escapeHtml(image.type)}" />`);
  if (image.width) tags.push(`<meta property="og:image:width" content="${escapeHtml(image.width)}" />`);
  if (image.height) tags.push(`<meta property="og:image:height" content="${escapeHtml(image.height)}" />`);
  if (image.alt) tags.push(`<meta property="og:image:alt" content="${escapeHtml(image.alt)}" />`);
  tags.push(`<meta property="og:locale" content="${locale}" />`);
  for (const alternate of alternates) {
    tags.push(`<meta property="og:locale:alternate" content="${escapeHtml(alternate)}" />`);
  }
  tags.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image.url)}" />`,
  );
  if (image.alt) tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(image.alt)}" />`);
  tags.push(`<script type="application/ld+json" id="seo-jsonld">${jsonScript(meta.jsonLd)}</script>`);
  return tags.join("\n    ");
}

function shell(main) {
  const links = [
    ...nav,
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
    ["/disclaimer", "Disclaimer"],
    ["/accessibility", "Accessibility"],
  ]
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

function linkedText(text) {
    return String(text)
      .split(/(https:\/\/[^\s)]+|adil\.zaman@uog\.edu\.pk)/g)
      .map((part) => {
              if (!part) return "";
              if (part.startsWith("https://")) {
                        const clean = part.replace(/[.,;:]$/, "");
                        const tail = part.slice(clean.length);
                        return `<a href="${escapeHtml(clean)}">${escapeHtml(clean)}</a>${escapeHtml(tail)}`;
              }
              if (part.includes("@")) return `<a href="mailto:${escapeHtml(part)}">${escapeHtml(part)}</a>`;
              return escapeHtml(part);
      })
      .join("");
}

function legalDocument(kind) {
    const doc = legalInstruments[kind];
    const page = PAGES[`/${kind}`];
    const path = `/${kind}`;
    const others = [
          ["/privacy", "Privacy Notice"],
          ["/disclaimer", "Academic and Editorial Disclaimer"],
          ["/accessibility", "Accessibility Statement"],
        ].filter(([href]) => href !== path);
    const sections = doc.sections
      .map((section, sectionIndex) => {
              const article = sectionIndex + 1;
              const clauses = section.clauses
                .map((clause, clauseIndex) => {
                            const body = typeof clause === "string" ? { text: clause } : clause;
                            const number = `${article}.${clauseIndex + 1}`;
                            const items = body.items
                              ? `<ol>${body.items
                                                       .map((item, itemIndex) => `<li>(${String.fromCharCode(97 + itemIndex)}) ${linkedText(item)}</li>`)
                                                       .join("")}</ol>`
                                          : "";
                            return `<li id="c-${number}"><strong>${number}</strong> ${linkedText(body.text)}${items}</li>`;
                })
                .join("");
              return `<section aria-labelledby="art-${article}"><h2 id="art-${article}">${article}. ${escapeHtml(section.heading)}</h2><ol>${clauses}</ol></section>`;
      })
      .join("");
    const main = [
          `<h1>${escapeHtml(doc.title)}</h1>`,
          `<p>${escapeHtml(doc.description)}</p>`,
          `<p>Document ${escapeHtml(doc.ref)} &middot; Version ${escapeHtml(doc.version)} &middot; Issued ${escapeHtml(LEGAL_ISSUED)} &middot; ${escapeHtml(doc.standing)}</p>`,
          `<p><a href="${escapeHtml(doc.file)}">Download PDF</a> — a copy for printing and filing; if this page and the PDF differ, this page is the text in force.</p>`,
          doc.preamble.map((paragraph) => `<p>${linkedText(paragraph)}</p>`).join(""),
          sections,
          `<h2>Attestation</h2>`,
          `<p>${escapeHtml(LEGAL_PROPRIETOR.name)}, ${escapeHtml(LEGAL_PROPRIETOR.role)}</p>`,
          `<p>Proprietor of ${escapeHtml(LEGAL_PROPRIETOR.site)}</p>`,
          `<p>Attested on ${escapeHtml(LEGAL_ISSUED)} in a personal professional capacity. This instrument is not a seal or a decision of the ${escapeHtml(LEGAL_PROPRIETOR.institution)}.</p>`,
          `<p>End of document ${escapeHtml(doc.ref)}.</p>`,
          `<h2>Related instruments</h2>`,
          linkList(others),
        ].join("");
    return ready({ meta: { ...page, path }, bootstrap: { path }, noscript: shell(main) });
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

function ready({ status = 200, robotsHeader, lang = "en", meta, bootstrap, noscript, preload = [] }) {
  const pageLang = meta.lang || lang;
  return {
    status,
    robotsHeader: robotsHeader || meta.robots || "index, follow",
    lang: pageLang,
    meta: {
      ...meta,
      lang: pageLang,
      jsonLd: meta.jsonLd || pageGraph({ ...meta, lang: pageLang }),
    },
    bootstrap,
    noscript,
    preload,
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
  if (path === "/current-projects") return projectsDocument();
  if (path === "/research-reviews") return archiveDocument("review");
  if (path === "/opinion-blogs") return archiveDocument("opinion");

  const publication = path.match(/^\/publications\/([^/]+)$/);
  if (publication) return publicationDocument(publication[1]);

  const review = path.match(/^\/research-reviews\/([^/]+)$/);
  if (review) return articleDocument(review[1], "review");

  const opinion = path.match(/^\/opinion-blogs\/([^/]+)$/);
  if (opinion) return articleDocument(opinion[1], "opinion");

if (path === "/privacy" || path === "/disclaimer" || path === "/accessibility") {
      return legalDocument(path.slice(1));
}
    if (path === "/terms") {
    const document = legalDocument("disclaimer");
    document.meta = {
      ...document.meta,
      title: "Terms",
      path: "/terms",
      canonicalPath: "/disclaimer",
    };
    document.bootstrap = { path: "/terms" };
    return document;
  }
  if (PAGES[path]) return staticDocument(path);
  return notFound(path);
}

async function homeDocument() {
  const page = PAGES["/"];
  const [featured, reviews, opinions, projects] = await Promise.all([
    Publication.find({ featured: true }).sort({ year: -1 }),
    Article.find({ kind: "review", published: true }).sort({ date: -1 }).limit(3),
    Article.find({ kind: "opinion", published: true }).sort({ date: -1 }).limit(3),
    Project.find({ published: true }).sort({ sortOrder: 1, updatedAt: -1 }).limit(4),
  ]);
  const data = {
    path: "/",
    featured: featured.map(presentPublication),
    reviews: reviews.map((item) => presentArticle(item)),
    opinions: opinions.map((item) => presentArticle(item)),
    projects: projects.map((item) => ({
      id: String(item._id),
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder || 0,
    })),
  };
  const main = [
    `<h1>${escapeHtml(PROFILE.name)}</h1>`,
    `<p>${escapeHtml("Dr. Adil Zaman is a Political Scientist and Researcher at the University of Gujrat. He researches elections, political behaviour, democratic institutions and the changing politics of Pakistan and South Asia.")}</p>`,
    `<p>${escapeHtml("His work is empirical political research: survey analysis and comparative study of electoral processes, citizen behaviour and democratic institutions.")}</p>`,
    ...ABOUT.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    `<h2>Opinion and blogs</h2>`,
    linkList(data.opinions.map((item) => [`/opinion-blogs/${item.slug}`, item.title])),
    `<p><a href="/opinion-blogs">Opinion and blogs</a></p>`,
    `<h2>Research areas</h2>`,
    ...areas.map(([title, text]) => `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>`),
    `<p><a href="/expertise">Research expertise</a></p>`,
    `<h2>Featured research</h2>`,
    linkList(data.featured.map((item) => [`/publications/${item.id}`, item.title])),
    `<p><a href="/publications">Publications</a></p>`,
    `<h2>Current projects</h2>`,
    ...data.projects.map((item) => `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>`),
    `<p><a href="/current-projects">Current projects</a></p>`,
    `<h2>Research reviews</h2>`,
    linkList(data.reviews.map((item) => [`/research-reviews/${item.slug}`, item.title])),
    `<p><a href="/research-reviews">Research reviews</a></p>`,
    `<h2>Research and academic services</h2>`,
    ...homeServices.map(([title, href, text]) => `<h3><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></h3><p>${escapeHtml(text)}</p>`),
    `<p>${escapeHtml(`Research interests include ${interests.join(", ")}.`)}</p>`,
    `<p><a href="/contact">Contact</a> <a href="mailto:${escapeHtml(PROFILE.email)}">${escapeHtml(PROFILE.email)}</a></p>`,
    `<p><a href="${escapeHtml(PROFILE.profiles[0])}">University of Gujrat faculty profile</a></p>`,
  ].join("");
  return ready({
    meta: { ...page, path: "/" },
    bootstrap: data,
    noscript: shell(main),
    preload: [
      { as: "image", href: "/media/bg-chamber.jpg", fetchpriority: "high" },
      { as: "image", href: "/media/portrait.jpg", fetchpriority: "high" },
    ],
  });
}

async function projectsDocument() {
  const page = PAGES["/current-projects"];
  const items = await Project.find({ published: true }).sort({ sortOrder: 1, updatedAt: -1 }).limit(500);
  const presented = items.map((item) => ({
    id: String(item._id),
    title: item.title,
    description: item.description,
    sortOrder: item.sortOrder || 0,
  }));
  const main = [
    `<h1>${escapeHtml(page.title)}</h1>`,
    `<p>${escapeHtml(page.description)}</p>`,
    ...presented.map((item) => `<h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p>`),
  ].join("");
  return ready({
    meta: { ...page, path: "/current-projects" },
    bootstrap: { path: "/current-projects", items: presented },
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
    lang: item.lang === "ur" ? "ur" : "en",
    ogType: "article",
    languages: contentLanguages(item.lang, item.alt?.lang),
    jsonLd: pageGraph({
      title: item.title,
      description,
      path,
      lang: item.lang === "ur" ? "ur" : "en",
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
    imageAlt: article.imageAlt || article.title,
    lang: article.lang === "ur" ? "ur" : "en",
    languages: contentLanguages(article.lang, article.alt?.lang),
    ogType: "article",
    jsonLd: pageGraph({
      title: article.title,
      description,
      path,
      lang: article.lang === "ur" ? "ur" : "en",
      image: article.image,
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
  const fallback = document.noscript ? `<div class="server-fallback">${document.noscript}</div>` : "";
  const docLang = document.lang === "ur" ? "ur" : "en";
    const docDir = docLang === "ur" ? "rtl" : "ltr";
    let html = template.replace(/<html lang="[^"]*">/i, `<html lang="${docLang}" dir="${docDir}">`);
  if (html.includes("<!--seo-head-->") && html.includes("<!--/seo-head-->")) {
    html = html.replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, `<!--seo-head-->\n    ${head}\n    <!--/seo-head-->`);
  }
  html = html.replace(
    /<script type="application\/json" id="bootstrap">[\s\S]*?<\/script>/,
    `<script type="application/json" id="bootstrap">${bootstrap}</script>`
  );
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  }
  if (html.includes("<!--seo-noscript-->")) {
    html = html.replace("<!--seo-noscript-->", "");
  }
  const preload = (document.preload || [])
    .map((item) => `<link rel="preload" as="${escapeHtml(item.as)}" href="${escapeHtml(item.href)}"${item.fetchpriority ? ` fetchpriority="${escapeHtml(item.fetchpriority)}"` : ""} />`)
    .join("\n    ");
  html = html.replace("<!--preload-->", preload);
  return html;
}

function xml(value) {
  return escapeHtml(value);
}

const SITEMAP_PAGES = "/sitemap-pages.xml";
const SITEMAP_PUBLICATIONS = "/sitemap-publications.xml";
const SITEMAP_WRITING = "/sitemap-writing.xml";

function lastmodTag(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`;
}

function imageTags(images = []) {
  return images
    .filter((image) => image?.loc)
    .map((image) => {
      const title = image.title ? `<image:title>${xml(image.title)}</image:title>` : "";
      const caption = image.caption ? `<image:caption>${xml(clip(image.caption, 200))}</image:caption>` : "";
      return `<image:image><image:loc>${xml(image.loc)}</image:loc>${title}${caption}</image:image>`;
    })
    .join("");
}

function urlset(entries) {
  const images = entries.some((entry) => entry.images?.length);
  const xmlns = images ? ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : "";
  const body = entries
    .map((entry) => `<url><loc>${xml(entry.loc)}</loc>${lastmodTag(entry.updated)}${imageTags(entry.images)}</url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xmlns}>${body}</urlset>\n`;
}

export function sitemapIndexXml() {
  const maps = [SITEMAP_PAGES, SITEMAP_PUBLICATIONS, SITEMAP_WRITING];
  const revised = new Date().toISOString().slice(0, 10);
  const body = maps
    .map((path) => `<sitemap><loc>${xml(`${ORIGIN}${path}`)}</loc><lastmod>${revised}</lastmod></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>\n`;
}

export function pagesSitemapXml() {
  const revised = new Date();
  return urlset(Object.keys(PAGES).filter((path) => path !== "/terms").map((path) => ({
    loc: `${ORIGIN}${path === "/" ? "/" : path}`,
    updated: revised,
    images: path === "/" || path === "/about"
      ? [{ loc: `${ORIGIN}${PROFILE.imagePath}`, title: "Portrait of Dr. Adil Zaman" }]
      : [],
  })));
}

export async function publicationsSitemapXml() {
  const items = await Publication.find().select("slug updatedAt title").lean();
  return urlset(items.map((item) => ({
    loc: `${ORIGIN}/publications/${item.slug}`,
    updated: item.updatedAt || new Date(),
  })));
}

export async function writingSitemapXml() {
  const items = await Article.find({ published: true }).select("slug kind updatedAt title image imageAlt").lean();
  return urlset(items.map((item) => {
    const base = item.kind === "review" ? "/research-reviews" : "/opinion-blogs";
    const image = item.image ? [{ loc: item.image, title: item.title, caption: item.imageAlt || item.title }] : [];
    return {
      loc: `${ORIGIN}${base}/${item.slug}`,
      updated: item.updatedAt || new Date(),
      images: image.map((picture) => ({ ...picture, loc: picture.loc.startsWith("http") ? picture.loc : `${ORIGIN}${picture.loc.startsWith("/") ? picture.loc : `/${picture.loc}`}` })),
    };
  }));
}

export function robotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /search",
    "Disallow: /api",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "",
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}

export function llmsTxt() {
  const pages = [
    ["About", "/about"],
    ["Opinion and Blogs", "/opinion-blogs"],
    ["Research Expertise", "/expertise"],
    ["Publications", "/publications"],
    ["Current Projects", "/current-projects"],
    ["Research Reviews", "/research-reviews"],
    ["Services", "/services"],
    ["Contact", "/contact"],
    ["Privacy Notice", "/privacy"],
    ["Terms", "/terms"],
    ["Academic Disclaimer", "/disclaimer"],
    ["Accessibility", "/accessibility"],
  ];
  return [
    "# Dr. Adil Zaman",
    "",
    `> ${PROFILE.description}`,
    "",
    "Public faculty site for Dr. Adil Zaman, political scientist at the University of Gujrat. Research pages may be read and quoted. Enquiries sent through the contact form are confidential.",
    "",
    "## Pages",
    "",
    ...pages.map(([name, path]) => `- [${name}](${ORIGIN}${path}): ${PAGES[path].description}`),
    "",
    "## Documents",
    "",
    `- [Privacy Notice](${ORIGIN}/documents/privacy-notice.pdf): How contact enquiries and page counts are handled.`,
    `- [Academic Disclaimer](${ORIGIN}/documents/academic-disclaimer.pdf): The terms of use and editorial disclaimer.`,
    `- [Accessibility Statement](${ORIGIN}/documents/accessibility-statement.pdf): Accessibility commitments for the site.`,
    "",
  ].join("\n");
}

export function documentMarkdown(document) {
  const title = document.meta?.title || PROFILE.name;
  const description = document.meta?.description || "";
  const path = document.meta?.path || "/";
  const text = String(document.noscript || "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<\/h1>/gi, "\n")
    .replace(/<h1[^>]*>/gi, "# ")
    .replace(/<\/h2>/gi, "\n")
    .replace(/<h2[^>]*>/gi, "## ")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|li|nav|main|ul|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `# ${title}\n\n${description}\n\nSource: ${ORIGIN}${path}\n\n${text}\n`;
}
