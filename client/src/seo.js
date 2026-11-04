import { readingCode } from "../../shared/reading.js";
import {
  ORIGIN,
  PROFILE,
  alternateLocales,
  articleNode,
  breadcrumbNode,
  clip,
  documentTitle,
  itemListNode,
  localeFor,
  pageGraph,
  robotsFor,
  scholarlyNode,
  socialFields,
} from "../../shared/seo.js";

export { articleNode, breadcrumbNode, itemListNode, scholarlyNode };

export function readBootstrap() {
  if (typeof document === "undefined") return null;
  const node = document.getElementById("bootstrap");
  if (!node) return null;
  try {
    const data = JSON.parse(node.textContent || "{}");
    if (!data || typeof data.path !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

function upsertMeta(attribute, key, content) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!content) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

export function applyHead({ title, description, path, robots, image, imageAlt, lang, languages, jsonLd, ogType }) {
  if (!title) return;
  const branded = documentTitle(title);
  const summary = clip(description || "");
  const url = `${ORIGIN}${path && path !== "/" ? path : "/"}`;
  const picture = socialFields(image, imageAlt);
  const pageLang = lang === "ur" ? "ur" : "en";
  document.title = branded;
  document.documentElement.lang = readingCode(lang);
  upsertMeta("name", "description", summary);
  upsertMeta("name", "author", PROFILE.name);
  upsertMeta("name", "robots", robots || robotsFor(path || "/"));
  upsertLink("canonical", url);
  upsertMeta("property", "og:site_name", PROFILE.name);
  upsertMeta("property", "og:type", ogType || "website");
  upsertMeta("property", "og:title", branded);
  upsertMeta("property", "og:description", summary);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", picture.url);
  upsertMeta("property", "og:image:secure_url", picture.secureUrl);
  upsertMeta("property", "og:image:type", picture.type);
  upsertMeta("property", "og:image:width", picture.width);
  upsertMeta("property", "og:image:height", picture.height);
  upsertMeta("property", "og:image:alt", picture.alt);
  upsertMeta("property", "og:locale", localeFor(pageLang));
  const alternates = alternateLocales(pageLang, languages);
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((node) => node.remove());
  for (const alternate of alternates) {
    const node = document.createElement("meta");
    node.setAttribute("property", "og:locale:alternate");
    node.setAttribute("content", alternate);
    document.head.appendChild(node);
  }
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", branded);
  upsertMeta("name", "twitter:description", summary);
  upsertMeta("name", "twitter:image", picture.url);
  upsertMeta("name", "twitter:image:alt", picture.alt);
  const scriptId = "seo-jsonld";
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  const graph = Array.isArray(jsonLd)
    ? pageGraph({ title, description: summary, path: path || "/", lang: pageLang, image, extra: jsonLd })
    : jsonLd || pageGraph({ title, description: summary, path: path || "/", lang: pageLang, image });
  script.textContent = JSON.stringify(graph).replace(/</g, "\\u003c");
}

export function applyRobots(content) {
  upsertMeta("name", "robots", content);
}
