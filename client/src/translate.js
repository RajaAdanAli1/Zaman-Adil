import { api } from "./api";

const memory = new Map();
const inflight = new Map();
let queue = [];
let timer = 0;
let pending = 0;
let failedTarget = "";
const listeners = new Set();
const devices = new Map();

function snapshot() {
  return { pending: pending > 0, failed: failedTarget };
}

function notify() {
  const next = snapshot();
  listeners.forEach((listener) => listener(next));
}

function bump(delta) {
  pending = Math.max(0, pending + delta);
  notify();
}

export function subscribeTranslation(listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function beginLanguage() {
  failedTarget = "";
  notify();
}

function deviceCode(code) {
  if (code === "zh-CN") return "zh-Hans";
  if (code === "zh-TW") return "zh-Hant";
  return code;
}

function within(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve("timeout"), ms)),
  ]);
}

async function deviceTranslator(source, target) {
  const key = `${source}|${target}`;
  if (devices.has(key)) return devices.get(key);
  devices.set(key, null);
  const Factory = typeof globalThis.Translator === "function" ? globalThis.Translator : null;
  if (!Factory?.create || !Factory.availability) return null;
  try {
    const sourceLanguage = deviceCode(source);
    const targetLanguage = deviceCode(target);
    const availability = await within(Factory.availability({ sourceLanguage, targetLanguage }), 700);
    if (availability !== "available") return null;
    const translator = await within(Factory.create({ sourceLanguage, targetLanguage }), 700);
    if (!translator || translator === "timeout") return null;
    devices.set(key, translator);
    return translator;
  } catch {
    return null;
  }
}

async function deviceTranslate(texts, source, target) {
  const translator = await deviceTranslator(source, target);
  if (!translator) return null;
  try {
    const translated = [];
    for (const text of texts) {
      const value = await within(translator.translate(text), 2500);
      if (!value || value === "timeout") return null;
      translated.push(String(value));
    }
    return { texts: translated, ok: translated.map((text) => Boolean(text)) };
  } catch {
    return null;
  }
}

async function serverTranslate(texts, source, target) {
  try {
    const data = await api("/api/translate", { method: "POST", body: { source, target, texts } });
    if (!Array.isArray(data?.texts) || data.texts.length !== texts.length) return null;
    const ok = Array.isArray(data.ok) ? data.ok.map(Boolean) : data.texts.map(() => true);
    return { texts: data.texts.map((text) => String(text ?? "")), ok };
  } catch {
    return null;
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(flush, 40);
}

async function runGroup(jobs) {
  const { source, target } = jobs[0];
  const texts = jobs.map((job) => job.text);
  const result = (await deviceTranslate(texts, source, target)) || (await serverTranslate(texts, source, target));
  jobs.forEach((job, index) => {
    const key = `${source}|${target}|${job.text}`;
    const failed = !result || result.ok?.[index] === false || result.texts?.[index] == null;
    const text = failed ? job.text : result.texts[index];
    if (!failed) memory.set(key, text);
    if (failed) failedTarget = target;
    inflight.delete(key);
    job.resolve({ text, failed });
  });
}

async function flush() {
  const jobs = queue.splice(0, 12);
  if (queue.length) schedule();
  if (!jobs.length) return;
  const groups = new Map();
  for (const job of jobs) {
    const id = `${job.source}\n${job.target}`;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(job);
  }
  bump(1);
  try {
    await Promise.all([...groups.values()].map(runGroup));
  } finally {
    bump(-1);
  }
}

export function translateText(text, target, source = "en") {
  const clean = String(text ?? "");
  if (!clean.trim() || target === source) return Promise.resolve({ text: clean, failed: false });
  const key = `${source}|${target}|${clean}`;
  if (memory.has(key)) return Promise.resolve({ text: memory.get(key), failed: false });
  if (inflight.has(key)) return inflight.get(key);
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  inflight.set(key, promise);
  queue.push({ text: clean, target, source, resolve });
  schedule();
  return promise;
}

export function translateMany(texts, target, source = "en") {
  return Promise.all(texts.map((text) => translateText(text, target, source))).then((items) => ({
    texts: items.map((item) => item.text),
    failed: items.some((item) => item.failed),
  }));
}
