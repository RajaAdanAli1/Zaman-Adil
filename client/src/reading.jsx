import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { copy, dirFor, readingCode, ui } from "../../shared/reading.js";
import { loadScriptFont } from "./fonts";
import { beginLanguage, subscribeTranslation, translateMany } from "./translate";

const LANG_KEY = "za-reading-lang";

const fallback = {
  lang: "en",
  dir: "ltr",
  openMenu: null,
  translating: false,
  failed: false,
  setLang() {},
  setOpenMenu() {},
  t: ui("en"),
};

const ReadingContext = createContext(fallback);

function storedLang() {
  try {
    return readingCode(localStorage.getItem(LANG_KEY));
  } catch {
    return "en";
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private browsing can refuse storage */
  }
}

function fill(template, count, fallbackText) {
  const value = String(count);
  if (String(template || "").includes("{n}")) return template.replaceAll("{n}", value);
  return `${value} ${fallbackText}`.trim();
}

function translatedPack(strings) {
  const next = { ...copy.en, ...strings };
  next.minRead = (count) => fill(strings.minReadTemplate, count, "min read");
  next.count = (count) => fill(Number(count) === 1 ? strings.countOne : strings.countMany, count, "publications");
  return next;
}

export function ReadingProvider({ children }) {
  const [lang, setLangState] = useState(storedLang);
  const [openMenu, setOpenMenu] = useState(null);
  const [pack, setPack] = useState(null);
  const [activity, setActivity] = useState({ pending: false, failed: "" });

  useEffect(() => subscribeTranslation(setActivity), []);

  useEffect(() => {
    loadScriptFont(lang);
  }, [lang]);

  useEffect(() => {
    function onStorage(event) {
      if (event.key === LANG_KEY) setLangState(readingCode(event.newValue));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (lang === "en" || lang === "ur") {
      setPack(null);
      return undefined;
    }
    let cancel = false;
    const keys = Object.keys(copy.en).filter((key) => typeof copy.en[key] === "string");
    translateMany(keys.map((key) => copy.en[key]), lang, "en").then((result) => {
      if (cancel) return;
      const strings = {};
      keys.forEach((key, index) => {
        strings[key] = result.texts[index] || copy.en[key];
      });
      setPack(strings);
    });
    return () => {
      cancel = true;
    };
  }, [lang]);

  const setLang = useCallback((next) => {
    const language = readingCode(next);
    beginLanguage();
    setLangState(language);
    setOpenMenu(null);
    writeStored(LANG_KEY, language);
  }, []);

  const setMenu = useCallback((next) => {
    setOpenMenu(next || null);
  }, []);

  const value = useMemo(() => ({
    lang,
    dir: dirFor(lang),
    openMenu,
    translating: activity.pending,
    failed: activity.failed === lang,
    t: lang === "en" || lang === "ur" || !pack ? ui(lang) : translatedPack(pack),
    setLang,
    setOpenMenu: setMenu,
  }), [lang, openMenu, activity, pack, setLang, setMenu]);

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  return useContext(ReadingContext);
}
