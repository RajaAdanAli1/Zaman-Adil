import { languageByCode } from "../../shared/languages.js";

const cache = new Map();
const MAX_CACHE = 1500;
const MAX_TEXTS = 40;
const MAX_CHARS = 4000;
const CHUNK = 350;

export function translationRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "The request body must be an object." };
  const source = String(body.source || "").trim();
  const target = String(body.target || "").trim();
  if (!languageByCode(source) || !languageByCode(target)) return { error: "Choose a supported language." };
  if (source === target) return { error: "Choose a different language." };
  if (!Array.isArray(body.texts) || body.texts.length < 1 || body.texts.length > MAX_TEXTS) {
    return { error: "Send between 1 and 40 texts." };
  }
  const texts = [];
  for (const item of body.texts) {
    if (typeof item !== "string") return { error: "Each text must be a string." };
    const clean = item.replace(/\u0000/g, "").trim();
    if (!clean || clean.length > MAX_CHARS) return { error: "Each text must be 1 to 4000 characters." };
    texts.push(clean);
  }
  return { value: { source, target, texts } };
}

function splitText(text) {
  if (text.length <= CHUNK) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > CHUNK) {
    let cut = rest.lastIndexOf(" ", CHUNK);
    if (cut < 80) cut = CHUNK;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function decode(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function upstream(text, source, target) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${source}|${target}`)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ZamanAdil/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("upstream");
  const data = await response.json();
  const translated = decode(data?.responseData?.translatedText || "");
  const details = `${data?.responseDetails || ""} ${translated}`;
  if (!translated || data?.responseStatus !== 200 || /MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(details)) {
    throw new Error("upstream");
  }
  return translated;
}

async function translateOne(text, source, target) {
  const key = `${source}|${target}|${text}`;
  if (cache.has(key)) return cache.get(key);
  const chunks = splitText(text);
  const parts = [];
  for (const chunk of chunks) parts.push(await upstream(chunk, source, target));
  const value = chunks.length === 1 ? parts[0] : parts.join(" ");
  cache.set(key, value);
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  return value;
}

export async function translateTexts({ source, target, texts }) {
  const results = new Array(texts.length);
  const ok = new Array(texts.length).fill(false);
  let cursor = 0;
  async function worker() {
    while (cursor < texts.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await translateOne(texts[index], source, target);
        ok[index] = true;
      } catch {
        results[index] = texts[index];
        ok[index] = false;
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  return { texts: results, ok };
}
