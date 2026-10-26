import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LANGUAGES, SUGGESTED, languageByCode } from "../../../shared/languages.js";
import { useReading } from "../reading";

function Globe() {
  return (
    <svg className="lang-globe" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 12h16M5.4 8.15h13.2M5.4 15.85h13.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function matches(language, query) {
  if (!query) return true;
  const haystack = `${language.name} ${language.native} ${language.code}`.toLowerCase();
  return haystack.includes(query);
}

export function LanguageMenu({ align = "start" }) {
  const reading = useReading();
  const { t } = reading;
  const menuId = useId();
  const listId = `${menuId}-list`;
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const open = reading.openMenu === menuId;
  const current = languageByCode(reading.lang) || LANGUAGES[0];
  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (needle) return LANGUAGES.filter((language) => matches(language, needle));
    const pinned = new Set(SUGGESTED);
    const suggested = SUGGESTED.map((code) => languageByCode(code)).filter(Boolean);
    const rest = LANGUAGES.filter((language) => !pinned.has(language.code));
    return [...suggested, ...rest];
  }, [needle]);

  const suggestedCount = needle ? 0 : SUGGESTED.length;

  const closeMenu = reading.setOpenMenu;

  useEffect(() => {
    if (!open) return undefined;
    const selected = visible.findIndex((language) => language.code === reading.lang);
    setActive(selected >= 0 ? selected : 0);
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) closeMenu(null);
    }
    function onKey(event) {
      if (event.key === "Escape") {
        closeMenu(null);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu, reading.lang]);

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector("[data-active='true']")?.scrollIntoView({ block: "nearest" });
  }, [open, active, needle]);

  function toggle() {
    setQuery("");
    reading.setOpenMenu(open ? null : menuId);
  }

  function choose(code) {
    setQuery("");
    reading.setLang(code);
    buttonRef.current?.focus();
  }

  function onSearchKey(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(visible.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && visible[active]) {
      event.preventDefault();
      choose(visible[active].code);
    }
  }

  function option(language, index) {
    const selected = language.code === reading.lang;
    return (
      <li key={language.code} role="presentation">
        <button
          type="button"
          role="option"
          id={`${menuId}-${language.code}`}
          className={`lang-option${selected ? " is-selected" : ""}`}
          aria-selected={selected}
          data-active={index === active ? "true" : "false"}
          lang={language.code}
          onMouseEnter={() => setActive(index)}
          onClick={() => choose(language.code)}
        >
          <span className="lang-native" lang={language.code} dir={language.dir}>{language.native}</span>
          <span className="lang-english">{language.name}</span>
          {selected && (
            <svg className="lang-check" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M5 12.5 9.2 17 19 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </li>
    );
  }

  const clamped = visible.length ? Math.min(active, visible.length - 1) : 0;

  return (
    <div className={`lang-menu${open ? " is-open" : ""} lang-align-${align}`} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`lang-button${reading.translating ? " is-busy" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${t.language}: ${current.name}`}
        onClick={toggle}
      >
        <Globe />
        <span className="lang-button-name" lang={current.code} dir={current.dir}>{current.native}</span>
        <span className="lang-button-code">{current.code.slice(0, 2)}</span>
        {reading.translating && <span className="lang-busy" aria-hidden="true" />}
        <svg className="lang-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 9.5 12 15.5 18 9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="lang-panel">
          <input
            ref={searchRef}
            className="lang-search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={visible[clamped] ? `${menuId}-${visible[clamped].code}` : undefined}
            aria-label={t.searchLanguages}
            placeholder={t.searchLanguages}
            value={query}
            autoComplete="off"
            spellCheck="false"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKey}
          />
          <ul id={listId} className="lang-list" role="listbox" aria-label={t.languageList}>
            {!needle && suggestedCount > 0 && <li className="lang-group" role="presentation">{t.suggested}</li>}
            {visible.slice(0, suggestedCount).map((language, index) => option(language, index))}
            {!needle && <li className="lang-group" role="presentation">{t.allLanguages}</li>}
            {visible.slice(suggestedCount).map((language, index) => option(language, index + suggestedCount))}
            {!visible.length && <li className="lang-empty" role="presentation">{t.noLanguage}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
