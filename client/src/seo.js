import { readingCode } from "../../shared/reading.js";
import {
  ORIGIN,
  PROFILE,
  absoluteUrl,
  articleNode,
  breadcrumbNode,
  clip,
  documentTitle,
  itemListNode,
  pageGraph,
  robotsFor,
  scholarlyNode,
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

export function applyHead({ title, description, path, robots, image, lang, jsonLd, ogType }) {
  if (!title) return;
  const branded = documentTitle(title);
  const summary = clip(description || "");
  const url = `${ORIGIN}${path && path !== "/" ? path : "/"}`;
  const picture = absoluteUrl(image || PROFILE.imagePath);
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
  upsertMeta("property", "og:image", picture);
  upsertMeta("property", "og:locale", lang === "ur" ? "ur_PK" : "en_US");
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", branded);
  upsertMeta("name", "twitter:description", summary);
  upsertMeta("name", "twitter:image", picture);
  const scriptId = "seo-jsonld";
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  const graph = Array.isArray(jsonLd)
    ? pageGraph({ title, description: summary, path: path || "/", extra: jsonLd })
    : jsonLd || pageGraph({ title, description: summary, path: path || "/" });
  script.textContent = JSON.stringify(graph).replace(/</g, "\\u003c");
}

export function applyRobots(content) {
  upsertMeta("name", "robots", content);
}
