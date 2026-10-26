import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { nav } from "../content";
import { api } from "../api";
import { applyHead } from "../seo";
import { navLabel } from "../../../shared/reading.js";
import { LanguageMenu } from "./LanguageMenu";
import { ReadingProvider, useReading } from "../reading";

export function Seal() {
  return (
    <span className="seal">
      <img src="/media/logo.png" alt="" />
    </span>
  );
}

export function usePage(title, description, extra = {}) {
  const location = useLocation();
  const path = extra.path || location.pathname;
  const robots = extra.robots;
  const image = extra.image || "";
  const lang = extra.lang || "en";
  const ogType = extra.ogType || "website";
  const jsonKey = JSON.stringify(extra.jsonLd || null);
  useEffect(() => {
    if (!title) return;
    applyHead({
      title,
      description,
      path,
      robots,
      image,
      lang,
      ogType,
      jsonLd: jsonKey === "null" ? undefined : JSON.parse(jsonKey),
    });
  }, [title, description, path, robots, image, lang, ogType, jsonKey]);
}

export function Layout({ children }) {
  return (
    <ReadingProvider>
      <SiteChrome>{children}</SiteChrome>
    </ReadingProvider>
  );
}

function SiteChrome({ children }) {
  const reading = useReading();
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const searchButtonRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    reading.setOpenMenu(null);
    window.scrollTo(0, 0);
    api("/api/track", { method: "POST", body: { path: location.pathname } }).catch(() => {});
  }, [location.pathname, reading.setOpenMenu]);

  useEffect(() => {
    document.body.classList.toggle("overlay-open", open || searchOpen);
    return () => document.body.classList.remove("overlay-open");
  }, [open, searchOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1181px)");
    function onChange() {
      if (media.matches) setOpen(false);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const media = window.matchMedia("(max-width: 1180px)");
    function sync() {
      const hidden = media.matches && !open;
      nav.inert = hidden;
      nav.toggleAttribute("aria-hidden", hidden);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      navRef.current?.querySelector("a")?.focus();
    });
    function onPointer(event) {
      if (!headerRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    function onKey(event) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.getElementById("search-dialog");
      if (!dialog) return;
      const nodes = [...dialog.querySelectorAll("a, button, input, select, textarea")].filter((node) => !node.disabled);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      searchButtonRef.current?.focus();
    };
  }, [searchOpen]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) return;
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="masthead" ref={headerRef}>
        <div className="masthead-inner">
          <Link className="brand" to="/">
            <Seal />
            <span>
              <strong>Dr. Adil Zaman</strong>
              <small>Political Scientist & Researcher</small>
            </span>
          </Link>
          <LanguageMenu align="start" />
          <nav
            id="primary-nav"
            ref={navRef}
            className={open ? "nav open" : "nav"}
            aria-label="Primary"
            onClick={(event) => {
              if (event.target.closest("a")) setOpen(false);
            }}
          >
            <div className="nav-panel">
              {nav.map(([href, label]) => {
                const text = navLabel(href, label, reading.lang, reading.t);
                const translated = text !== label;
                return (
                  <NavLink key={href} to={href} end={href === "/"} lang={translated ? reading.lang : undefined}>
                    {text}
                  </NavLink>
                );
              })}
            </div>
          </nav>
          <button
            ref={searchButtonRef}
            className="search-btn"
            type="button"
            aria-label="Search"
            onClick={() => {
              setOpen(false);
              reading.setOpenMenu(null);
              setSearchOpen(true);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
              <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15.8 15.8 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="search-label">Search</span>
          </button>
          <button
            ref={menuButtonRef}
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => {
              reading.setOpenMenu(null);
              setOpen((value) => !value);
            }}
          >
            <span className="menu-bars" aria-hidden="true"><span /><span /><span /></span>
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="frame footer-grid">
          <div className="footer-brand">
            <Seal />
            <div>
              <strong>Dr. Adil Zaman</strong>
              <p className="role">Political Scientist · Researcher · Academic</p>
              <p>Research interests include elections, political behaviour, democratic institutions, Pakistan politics and South Asian politics.</p>
            </div>
          </div>
          <div>
            <h2>Explore</h2>
            <ul>
              {nav.slice(1, 6).map(([href, label]) => {
                const text = navLabel(href, label, reading.lang, reading.t);
                return (
                  <li key={href}><Link to={href} lang={text !== label ? reading.lang : undefined}>{text}</Link></li>
                );
              })}
            </ul>
          </div>
          <div>
            <h2>Professional</h2>
            <ul>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="mailto:adil.zaman@uog.edu.pk">adil.zaman@uog.edu.pk</a></li>
            </ul>
          </div>
        </div>
        <div className="frame legal">
          <p>© {new Date().getFullYear()} Dr. Adil Zaman. All rights reserved.</p>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/disclaimer">Disclaimer</Link>
            <Link to="/accessibility">Accessibility</Link>
          </nav>
        </div>
      </footer>
      {searchOpen && (
        <div className="scrim" onPointerDown={() => setSearchOpen(false)}>
            <form
            id="search-dialog"
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-title"
            onPointerDown={(event) => event.stopPropagation()}
            onSubmit={submitSearch}
          >
            <div className="dialog-head">
              <h2 id="search-title">Search the archive</h2>
              <button className="icon-btn" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="dialog-row">
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Publications, reviews, pages" aria-label="Search" />
              <button className="btn solid" type="submit">Search</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
