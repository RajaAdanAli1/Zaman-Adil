import { ARTICLE_KINDS, ARTICLE_LANGS, PUBLICATION_TYPES } from "../../shared/catalog.js";
import { bareDoi, httpUrl, isSlug, safeHref } from "../../shared/links.js";

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function fail(error) {
  return { error };
}

export function guardBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("The request body must be an object.");
  for (const key of Object.keys(body)) {
    if (key.startsWith("$") || key.includes(".")) return fail("The request contains fields that cannot be updated.");
  }
  return null;
}

function cleanText(value) {
  return String(value).replace(/\u0000/g, "").trim();
}

function text(value, max, { required = false, label = "A field" } = {}) {
  if (value == null || value === "") {
    return required ? fail(`${label} is required.`) : { value: "" };
  }
  if (typeof value !== "string") return fail(`${label} must be text.`);
  const trimmed = cleanText(value);
  if (!trimmed && required) return fail(`${label} cannot be empty.`);
  if (trimmed.length > max) return fail(`${label} is too long.`);
  return { value: trimmed };
}

function yearValue(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value < 1900 || value > 2100) return fail("Enter a publication year between 1900 and 2100.");
    return { value };
  }
  if (typeof value === "string" && /^\d{4}$/.test(value.trim())) return yearValue(Number(value.trim()));
  return fail("Enter a publication year between 1900 and 2100.");
}

function bool(value, label) {
  if (typeof value === "boolean") return { value };
  if (value === "true") return { value: true };
  if (value === "false") return { value: false };
  return fail(`${label} must be true or false.`);
}

function optionalUrl(value, label) {
  if (value == null || value === "") return { value: "" };
  if (typeof value !== "string") return fail(`${label} must be an http or https URL.`);
  const trimmed = cleanText(value);
  if (!trimmed) return { value: "" };
  const href = httpUrl(trimmed);
  if (!href) return fail(`${label} must be an http or https URL.`);
  if (href.length > 1000) return fail(`${label} is too long.`);
  return { value: href };
}

function optionalDoi(value) {
  if (value == null || value === "") return { value: "" };
  if (typeof value !== "string") return fail("Enter a DOI, or leave it blank.");
  const trimmed = cleanText(value);
  if (!trimmed) return { value: "" };
  const doi = bareDoi(trimmed);
  if (!doi) return fail("Enter a DOI, or leave it blank.");
  return { value: doi };
}

function optionalMedia(value) {
  if (value == null || value === "") return { value: "" };
  if (typeof value !== "string") return fail("The image path must be a site path or an http(s) URL.");
  const trimmed = cleanText(value);
  if (!trimmed) return { value: "" };
  const href = safeHref(trimmed);
  if (!href || href.length > 500) return fail("The image path must be a site path or an http(s) URL.");
  return { value: href };
}

function paragraphList(value, maxItems, label) {
  if (value == null) return { value: [] };
  if (!Array.isArray(value) || value.length > maxItems) return fail(`${label} is not valid.`);
  const items = [];
  for (const paragraph of value) {
    const parsed = text(paragraph, 8000, { required: true, label });
    if (parsed.error) return parsed;
    items.push(parsed.value);
  }
  return { value: items };
}

function sectionList(value) {
  if (value == null) return { value: [] };
  if (!Array.isArray(value) || value.length > 40) return fail("The article sections are not valid.");
  const sections = [];
  for (const section of value) {
    if (!section || typeof section !== "object" || Array.isArray(section)) return fail("The article sections are not valid.");
    const heading = text(section.heading, 200, { required: true, label: "A section heading" });
    if (heading.error) return heading;
    const paragraphs = paragraphList(section.paragraphs, 40, "A section paragraph");
    if (paragraphs.error) return paragraphs;
    sections.push({ heading: heading.value, paragraphs: paragraphs.value });
  }
  return { value: sections };
}

function emptyAlt() {
  return { lang: "", title: "", subtitle: "", summary: "", citation: "", paragraphs: [], sections: [] };
}

function altEdition(value, { article }) {
  if (value == null || value === "") return { value: emptyAlt() };
  if (typeof value !== "object" || Array.isArray(value)) return fail("The other language is not valid.");
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) return fail("The request contains fields that cannot be updated.");
  }
  const title = text(value.title, 300, { label: "The other-language title" });
  if (title.error) return title;
  if (!title.value) return { value: emptyAlt() };
  const lang = value.lang == null || value.lang === "" ? "" : value.lang;
  if (typeof lang !== "string" || !ARTICLE_LANGS.includes(lang)) return fail("Select a language for the other text.");
  const subtitle = text(value.subtitle, 300, { label: "The other-language subtitle" });
  if (subtitle.error) return subtitle;
  const summary = text(value.summary, 2000, { label: "The other-language summary" });
  if (summary.error) return summary;
  const citation = text(value.citation, 1000, { label: "The other-language citation" });
  if (citation.error) return citation;
  const paragraphs = paragraphList(value.paragraphs, 80, "A paragraph in the other language");
  if (paragraphs.error) return paragraphs;
  const sections = sectionList(value.sections);
  if (sections.error) return sections;
  if (article && !paragraphs.value.length && !sections.value.some((section) => section.paragraphs.length)) {
    return fail("Add the text for the other language, or clear its title.");
  }
  return {
    value: {
      lang,
      title: title.value,
      subtitle: subtitle.value,
      summary: summary.value,
      citation: citation.value,
      paragraphs: paragraphs.value,
      sections: sections.value,
    },
  };
}

function assignSlug(value, body, { partial, present }) {
  if (present("slug") && body.slug != null && String(body.slug).trim()) {
    if (typeof body.slug !== "string") return fail("The URL slug must be text.");
    const slug = slugify(body.slug);
    if (!slug) return fail("The URL slug needs letters or numbers.");
    value.slug = slug;
    return null;
  }
  if (!partial || present("title")) {
    const slug = slugify(value.title || "");
    if (!slug) return fail("The title needs letters or numbers so a URL can be created.");
    value.slug = slug;
  }
  return null;
}

function assign(target, key, parsed) {
  if (parsed?.error) return parsed.error;
  if (parsed && Object.prototype.hasOwnProperty.call(parsed, "value")) target[key] = parsed.value;
  return "";
}

export function publicationFrom(body, { partial = false } = {}) {
  const invalid = guardBody(body);
  if (invalid) return invalid;
  const value = {};
  const present = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || present("title")) {
    const error = assign(value, "title", text(body.title, 300, { required: true, label: "The title" }));
    if (error) return fail(error);
  }
  if (!partial || present("authors")) {
    const error = assign(value, "authors", text(body.authors, 500, { required: true, label: "Authors" }));
    if (error) return fail(error);
  }
  if (!partial || present("year")) {
    const error = assign(value, "year", yearValue(body.year));
    if (error) return fail(error);
  }
  if (!partial || present("venue")) {
    const error = assign(value, "venue", text(body.venue, 300, { label: "The journal or publisher" }));
    if (error) return fail(error);
  }
  if (!partial || present("type")) {
    const type = body.type == null || body.type === "" ? "Journal Article" : body.type;
    if (typeof type !== "string" || !PUBLICATION_TYPES.includes(type)) return fail("Select a publication type.");
    value.type = type;
  }
  for (const [key, label, max] of [
    ["volume", "The volume", 40],
    ["issue", "The issue", 40],
    ["pages", "The pages", 40],
    ["summary", "The summary", 2000],
  ]) {
    if (!partial || present(key)) {
      const error = assign(value, key, text(body[key], max, { label }));
      if (error) return fail(error);
    }
  }
  if (!partial || present("doi")) {
    const error = assign(value, "doi", optionalDoi(body.doi));
    if (error) return fail(error);
  }
  if (!partial || present("url")) {
    const error = assign(value, "url", optionalUrl(body.url, "The publisher URL"));
    if (error) return fail(error);
  }
  if (!partial || present("pdf")) {
    const error = assign(value, "pdf", optionalUrl(body.pdf, "The PDF URL"));
    if (error) return fail(error);
  }
  if (!partial || present("featured")) {
    const error = assign(value, "featured", body.featured == null ? { value: false } : bool(body.featured, "Featured"));
    if (error) return fail(error);
  }
  if (!partial || present("sortOrder")) {
    const raw = body.sortOrder == null || body.sortOrder === "" ? 100 : body.sortOrder;
    const number = typeof raw === "number" ? raw : typeof raw === "string" && /^-?\d+$/.test(raw.trim()) ? Number(raw) : NaN;
    if (!Number.isInteger(number) || number < 0 || number > 100000) return fail("Sort order must be a whole number.");
    value.sortOrder = number;
  }
  if (!partial || present("lang")) {
    const lang = body.lang == null || body.lang === "" ? "en" : body.lang;
    if (typeof lang !== "string" || !ARTICLE_LANGS.includes(lang)) return fail("Select a language.");
    value.lang = lang;
  }
  if (!partial || present("alt")) {
    const alt = altEdition(body.alt, { article: false });
    if (alt.error) return alt;
    if (alt.value.lang && value.lang && alt.value.lang === value.lang) {
      return fail("The other language must be different from the record language.");
    }
    value.alt = alt.value;
  }
  const slugError = assignSlug(value, body, { partial, present });
  if (slugError) return slugError;
  if (!Object.keys(value).length) return fail("There is nothing to update.");
  return { value };
}

function isoDate(value) {
  if (typeof value !== "string") return fail("Enter a valid date.");
  const raw = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fail("Enter a valid date.");
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return fail("Enter a valid date.");
  return { value: raw };
}

export function articleFrom(body, { partial = false } = {}) {
  const invalid = guardBody(body);
  if (invalid) return invalid;
  const value = {};
  const present = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || present("title")) {
    const error = assign(value, "title", text(body.title, 300, { required: true, label: "The title" }));
    if (error) return fail(error);
  }
  if (!partial || present("kind")) {
    if (typeof body.kind !== "string" || !ARTICLE_KINDS.includes(body.kind)) return fail("Select research review or opinion.");
    value.kind = body.kind;
  }
  if (!partial || present("date")) {
    const error = assign(value, "date", isoDate(body.date));
    if (error) return fail(error);
  }
  for (const [key, label, max] of [
    ["subtitle", "The subtitle", 300],
    ["category", "The category", 80],
    ["imageAlt", "The image description", 300],
    ["author", "The author", 120],
    ["citation", "The citation", 1000],
  ]) {
    if (!partial || present(key)) {
      const error = assign(value, key, text(body[key], max, { label }));
      if (error) return fail(error);
    }
  }
  if (!partial || present("lang")) {
    const lang = body.lang == null || body.lang === "" ? "en" : body.lang;
    if (typeof lang !== "string" || !ARTICLE_LANGS.includes(lang)) return fail("Select a language.");
    value.lang = lang;
  }
  if (!partial || present("image")) {
    const error = assign(value, "image", optionalMedia(body.image));
    if (error) return fail(error);
  }
  if (!partial || present("doi")) {
    const error = assign(value, "doi", optionalDoi(body.doi));
    if (error) return fail(error);
  }
  if (!partial || present("paragraphs")) {
    const paragraphs = paragraphList(body.paragraphs, 80, "A paragraph");
    if (paragraphs.error) return paragraphs;
    value.paragraphs = paragraphs.value;
  }
  if (!partial || present("sections")) {
    const sections = sectionList(body.sections);
    if (sections.error) return sections;
    value.sections = sections.value;
  }
  if (!partial || present("published")) {
    const error = assign(value, "published", body.published == null ? { value: true } : bool(body.published, "Published"));
    if (error) return fail(error);
  } else if (!partial) {
    value.published = true;
  }
  if (!partial || present("alt")) {
    const alt = altEdition(body.alt, { article: true });
    if (alt.error) return alt;
    const primary = value.lang || (body.lang == null || body.lang === "" ? "en" : body.lang);
    if (alt.value.lang && primary && alt.value.lang === primary) {
      return fail("The other language must be different from the record language.");
    }
    value.alt = alt.value;
  }
  const slugError = assignSlug(value, body, { partial, present });
  if (slugError) return slugError;
  if (!partial && value.author === "") value.author = "Dr. Adil Zaman";
  if (!Object.keys(value).length) return fail("There is nothing to update.");
  return { value };
}

export function projectFrom(body, { partial = false } = {}) {
  const invalid = guardBody(body);
  if (invalid) return invalid;
  const value = {};
  const present = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || present("title")) {
    const error = assign(value, "title", text(body.title, 200, { required: true, label: "The title" }));
    if (error) return fail(error);
  }
  if (!partial || present("description")) {
    const error = assign(value, "description", text(body.description, 5000, { required: true, label: "The description" }));
    if (error) return fail(error);
  }
  if (!partial || present("sortOrder")) {
    const raw = body.sortOrder == null || body.sortOrder === "" ? 0 : body.sortOrder;
    const number = typeof raw === "number" ? raw : typeof raw === "string" && /^-?\d+$/.test(raw.trim()) ? Number(raw) : NaN;
    if (!Number.isInteger(number) || number < 0 || number > 100000) return fail("Sort order must be a whole number.");
    value.sortOrder = number;
  }
  if (!partial || present("published")) {
    const error = assign(value, "published", body.published == null ? { value: true } : bool(body.published, "Published"));
    if (error) return fail(error);
  } else if (!partial) {
    value.published = true;
  }
  if (!Object.keys(value).length) return fail("There is nothing to update.");
  return { value };
}

export function commentFrom(body) {
  const invalid = guardBody(body);
  if (invalid) return invalid;
  const name = text(body.name, 120, { required: true, label: "Your name" });
  if (name.error) return name;
  const emailRaw = body.email == null || body.email === "" ? { value: "" } : text(body.email, 180, { label: "Email" });
  if (emailRaw.error) return emailRaw;
  if (emailRaw.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw.value)) {
    return fail("Enter a valid email address, or leave it blank.");
  }
  const comment = text(body.body, 2000, { required: true, label: "The comment" });
  if (comment.error) return comment;
  if (typeof body.kind !== "string" || !ARTICLE_KINDS.includes(body.kind)) {
    return fail("Unknown article kind.");
  }
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!isSlug(slug)) return fail("That article could not be found.");
  return {
    value: {
      name: name.value,
      email: emailRaw.value,
      body: comment.value,
      articleKind: body.kind,
      articleSlug: slug,
    },
  };
}

export function objectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value) ? value : "";
}
