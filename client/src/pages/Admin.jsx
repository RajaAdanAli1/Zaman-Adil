import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { contentFrom, contentTo } from "../articleText";
import { otherLang } from "../../../shared/reading.js";
import { ReadingProvider } from "../reading";
import { applyRobots } from "../seo";
import { PUBLICATION_TYPES } from "../../../shared/catalog.js";
import { doiUrl, safeHref } from "../../../shared/links.js";

const REVIEW_CATEGORIES = ["Elections", "Electoral Integrity", "Voting Behaviour", "Political Participation", "Democracy", "Political Institutions", "Pakistan", "South Asia", "Research Methods"];
const OPINION_CATEGORIES = ["Politics", "Society", "Economy", "International Affairs", "Pakistan", "South Asia", "Culture", "Geography"];

function clean(body) {
  const next = { ...body };
  delete next._id;
  delete next.__v;
  delete next.createdAt;
  delete next.updatedAt;
  delete next.paragraphsText;
  delete next.contentText;
  return next;
}

function editionDraft(item) {
  const alt = item?.alt || {};
  return {
    altTitle: alt.title || "",
    altSubtitle: alt.subtitle || "",
    altCitation: alt.citation || "",
    altSummary: alt.summary || "",
    altText: contentFrom(alt),
  };
}

function withEdition(draft, { article }) {
  const primary = draft.lang === "ur" ? "ur" : "en";
  const parsed = article ? contentTo(draft.altText || "") : { paragraphs: [], sections: [] };
  const title = String(draft.altTitle || "").trim();
  const body = clean({
    ...draft,
    lang: primary,
    alt: {
      lang: title ? otherLang(primary) : "",
      title,
      subtitle: draft.altSubtitle || "",
      summary: draft.altSummary || "",
      citation: draft.altCitation || "",
      paragraphs: parsed.paragraphs,
      sections: parsed.sections,
    },
  });
  delete body.altTitle;
  delete body.altSubtitle;
  delete body.altCitation;
  delete body.altSummary;
  delete body.altText;
  return body;
}

function languageBadge(item) {
  const primary = item.lang === "ur" ? "UR" : "EN";
  const secondary = item.alt?.title ? (item.alt.lang === "ur" ? "UR" : "EN") : "";
  if (primary === "EN" && !secondary) return null;
  return <span className="badge">{secondary ? `${primary} · ${secondary}` : primary}</span>;
}

function useFormAnchor(error) {
  const formRef = useRef(null);
  const noticeRef = useRef(null);
  const [token, setToken] = useState(0);
  useEffect(() => {
    if (!token) return;
    formRef.current?.scrollIntoView({ block: "start" });
  }, [token]);
  useEffect(() => {
    if (!error) return;
    noticeRef.current?.focus();
    noticeRef.current?.scrollIntoView({ block: "nearest" });
  }, [error]);
  return { formRef, noticeRef, markOpened: () => setToken((value) => value + 1) };
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const sideRef = useRef(null);
  useEffect(() => {
    api("/api/admin/stats").then((data) => setUnread(data.unread || 0)).catch(() => {});
  }, []);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle("overlay-open", menuOpen);
    return () => document.body.classList.remove("overlay-open");
  }, [menuOpen]);
  useEffect(() => {
    const side = sideRef.current;
    if (!side) return undefined;
    const media = window.matchMedia("(max-width: 900px)");
    function sync() {
      const hidden = media.matches && !menuOpen;
      side.inert = hidden;
      side.toggleAttribute("aria-hidden", hidden);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      sideRef.current?.querySelector("a")?.focus();
    });
    function onKey(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !window.matchMedia("(max-width: 900px)").matches) return;
      const side = sideRef.current;
      if (!side) return;
      const nodes = [...side.querySelectorAll("a, button, input, select, textarea")].filter((node) => !node.disabled);
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
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    navigate("/admin/login");
  }
  return (
    <div className={menuOpen ? "desk desk-open" : "desk"}>
      <div className="desk-bar">
        <button
          ref={menuBtnRef}
          className="menu-btn"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="desk-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="menu-bars" aria-hidden="true"><span /><span /><span /></span>
        </button>
        <strong>Research desk</strong>
      </div>
      {menuOpen && <button className="desk-scrim" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className="desk-side" id="desk-nav" ref={sideRef}>
        <div className="desk-brand">
          <img src="/media/logo.jpg" alt="" />
          <div>
            <strong>Research desk</strong>
            <small>Dr. Adil Zaman</small>
          </div>
        </div>
        <nav className="desk-nav" aria-label="Desk" onClick={() => setMenuOpen(false)}>
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/publications">Publications</NavLink>
          <NavLink to="/admin/articles">Writing</NavLink>
          <NavLink to="/admin/messages">
            Messages {unread > 0 && <em className="nav-count">{unread}</em>}
          </NavLink>
          <NavLink to="/admin/password">Password</NavLink>
        </nav>
        <div className="desk-foot">
          <Link to="/">View public site</Link>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="desk-main"><Outlet /></div>
    </div>
  );
}

function Guard() {
  const [user, setUser] = useState(undefined);
  const navigate = useNavigate();
  useEffect(() => {
    api("/api/admin/me").then(setUser).catch(() => setUser(null));
  }, []);
  useEffect(() => {
    if (user === null) navigate("/admin/login", { replace: true });
  }, [user, navigate]);
  if (!user) return null;
  if (user.mustChangePassword) {
    return <ForcePassword onChanged={() => setUser({ ...user, mustChangePassword: false })} />;
  }
  return <Shell />;
}

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: { username: data.get("username"), password: data.get("password") },
      });
      navigate("/admin");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <div className="login-wrap">
      <form className="login-card contact-form" onSubmit={submit}>
        <img className="login-seal" src="/media/logo.jpg" alt="" />
        <p className="kicker">Private</p>
        <h1>Research desk</h1>
        <p className="support">Sign in to manage publications, writing and enquiries.</p>
        {error && <p className="notice error" role="alert">{error}</p>}
        <label className="field">Username<input name="username" required autoComplete="username" /></label>
        <label className="field">Password<input name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn solid" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

function ForcePassword({ onChanged }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    navigate("/admin/login");
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.target);
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    try {
      await api("/api/admin/password", { method: "POST", body: { password } });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="login-wrap">
      <form className="login-card contact-form" onSubmit={submit}>
        <img className="login-seal" src="/media/logo.jpg" alt="" />
        <p className="kicker">Required</p>
        <h1>Set a new password</h1>
        <p className="support">This desk is still using a temporary password. Choose a private one before the archive opens.</p>
        {error && <p className="notice error" role="alert">{error}</p>}
        <label className="field">New password<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <label className="field">Confirm password<input name="confirm" type="password" required minLength={10} autoComplete="new-password" /></label>
        <div className="actions">
          <button className="btn solid" type="submit">Save and continue</button>
          <button className="btn line" type="button" onClick={logout}>Sign out</button>
        </div>
      </form>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/admin/stats").then(setData).catch((err) => setError(err.message));
  }, []);
  if (error) return <p className="notice error">{error}</p>;
  if (!data) return <p className="note">Opening the desk…</p>;
  const cards = [
    ["/admin/publications", "Publications", data.publications],
    ["/admin/articles", "Research reviews", data.reviews],
    ["/admin/articles", "Opinion and blogs", data.opinions],
    ["/admin/messages", "Unread messages", data.unread],
  ];
  return (
    <>
      <header className="desk-head">
        <p className="kicker">Overview</p>
        <h1>Dashboard</h1>
        <p>{data.views} recorded page views. Use the cards to open each part of the archive.</p>
      </header>
      <div className="stat-grid">
        {cards.map(([href, label, value]) => (
          <Link className="stat stat-link" to={href} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </div>
      <div className="desk-split">
        <section className="desk-panel">
          <div className="split">
            <h2>Recent enquiries</h2>
            <Link className="text-link" to="/admin/messages">Inbox</Link>
          </div>
          {data.messages.length === 0 ? <p className="note">No enquiries yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>From</th><th>Subject</th></tr></thead>
                <tbody>
                  {data.messages.map((message) => (
                    <tr key={message._id}>
                      <td className="col-fit" data-label="Date">{String(message.createdAt).slice(0, 10)}</td>
                      <td data-label="From">{message.name} {message.isRead ? "" : <span className="badge">New</span>}</td>
                      <td data-label="Subject"><Link to="/admin/messages">{message.subject}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <div className="desk-stack">
          <section className="desk-panel">
            <div className="split">
              <h2>Needs a record</h2>
              <Link className="text-link" to="/admin/publications">Archive</Link>
            </div>
            {data.missing.length === 0 ? <p className="note">Every publication has a DOI, journal link, or PDF.</p> : (
              <ul className="desk-list">
                {data.missing.map((item) => (
                  <li key={item._id}><span>{item.year}</span> {item.title}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="desk-panel">
            <h2>Recently edited</h2>
            <ul className="desk-list">
              {data.recent.map((item) => (
                <li key={item._id}><span>{item.year}</span> {item.title}</li>
              ))}
            </ul>
          </section>
          <section className="desk-panel">
            <h2>Most visited</h2>
            {data.pages.length === 0 ? <p className="note">Page counts appear after the public site is used.</p> : (
              <ul className="desk-list">
                {data.pages.map((page) => (
                  <li key={page.path}><span>{page.views}</span> {page.path}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

const blankPublication = {
  title: "", authors: "", year: new Date().getFullYear(), venue: "", type: "Journal Article",
  volume: "", issue: "", pages: "", doi: "", url: "", pdf: "", summary: "", featured: false, slug: "", sortOrder: 100,
  lang: "en",
};

function PublicationsAdmin() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { formRef, noticeRef, markOpened } = useFormAnchor(error);

  function load() { api("/api/admin/publications").then(setItems); }
  useEffect(load, []);

  const visible = useMemo(() => items.filter((item) => {
    if (type && item.type !== type) return false;
    const linked = item.url || item.doi || item.pdf;
    if (onlyMissing && linked) return false;
    const haystack = `${item.title} ${item.alt?.title || ""} ${item.authors} ${item.venue} ${item.year}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [items, query, type, onlyMissing]);

  function field(name) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setDraft((current) => ({ ...current, [name]: value }));
    };
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const body = withEdition({ ...draft, year: Number(draft.year), sortOrder: Number(draft.sortOrder) || 0 }, { article: false });
    try {
      if (draft._id) await api(`/api/admin/publications/${draft._id}`, { method: "PUT", body });
      else await api("/api/admin/publications", { method: "POST", body });
      setDraft(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this publication from the public archive?")) return;
    await api(`/api/admin/publications/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <header className="desk-head split">
        <div>
          <p className="kicker">Archive</p>
          <h1>Publications</h1>
          <p>{visible.length} of {items.length} records</p>
        </div>
        <button className="btn solid" type="button" onClick={() => { setDraft({ ...blankPublication }); markOpened(); }}>New publication</button>
      </header>
      <div className="desk-tools">
        <input aria-label="Search publications" placeholder="Search title, author, journal" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Publication type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All types</option>
          {PUBLICATION_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} /> Missing a link</label>
      </div>
      {draft && (
        <form ref={formRef} className="admin-form desk-panel" onSubmit={save}>
          {error && <p ref={noticeRef} tabIndex={-1} className="notice error" role="alert">{error}</p>}
          <div className="fields">
            <label className="field full">Title<input required value={draft.title} onChange={field("title")} lang={draft.lang === "ur" ? "ur" : "en"} dir={draft.lang === "ur" ? "rtl" : "ltr"} className={draft.lang === "ur" ? "urdu-field" : undefined} /></label>
            <label className="field">Authors<input required value={draft.authors} onChange={field("authors")} /></label>
            <label className="field">Year<input required type="number" value={draft.year} onChange={field("year")} /></label>
            <label className="field">Journal or publisher<input value={draft.venue || ""} onChange={field("venue")} /></label>
            <label className="field">Type
              <select value={draft.type} onChange={field("type")}>
                {PUBLICATION_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="field">Volume<input value={draft.volume || ""} onChange={field("volume")} /></label>
            <label className="field">Issue<input value={draft.issue || ""} onChange={field("issue")} /></label>
            <label className="field">Pages<input value={draft.pages || ""} onChange={field("pages")} /></label>
            <label className="field">DOI<input value={draft.doi || ""} onChange={field("doi")} placeholder="10.xxxx/…" /></label>
            <label className="field full">Publisher URL<input value={draft.url || ""} onChange={field("url")} /></label>
            <label className="field full">PDF URL<input value={draft.pdf || ""} onChange={field("pdf")} /></label>
            <label className="field">URL slug<input value={draft.slug || ""} onChange={field("slug")} placeholder="Generated from the title if empty" /></label>
            <label className="field">Sort order<input type="number" value={draft.sortOrder ?? 100} onChange={field("sortOrder")} /></label>
            <label className="field full">Summary<textarea value={draft.summary || ""} onChange={field("summary")} lang={draft.lang === "ur" ? "ur" : "en"} dir={draft.lang === "ur" ? "rtl" : "ltr"} className={draft.lang === "ur" ? "urdu-field" : undefined} /></label>
            <label className="field">Language of this record
              <select value={draft.lang || "en"} onChange={field("lang")}>
                <option value="en">English</option>
                <option value="ur">Urdu</option>
              </select>
            </label>
            <p className="field full note">Readers can switch between English and Urdu on the publication, review and opinion pages. Leave the other title blank when this record is in one language only.</p>
            <label className="field full">{draft.lang === "ur" ? "English title" : "Urdu title"}
              <input value={draft.altTitle || ""} onChange={field("altTitle")} lang={draft.lang === "ur" ? "en" : "ur"} dir={draft.lang === "ur" ? "ltr" : "rtl"} className={draft.lang === "ur" ? undefined : "urdu-field"} />
            </label>
            <label className="field full">{draft.lang === "ur" ? "English summary" : "Urdu summary"}
              <textarea value={draft.altSummary || ""} onChange={field("altSummary")} lang={draft.lang === "ur" ? "en" : "ur"} dir={draft.lang === "ur" ? "ltr" : "rtl"} className={draft.lang === "ur" ? undefined : "urdu-field"} />
            </label>
            <label className="check full"><input type="checkbox" checked={!!draft.featured} onChange={field("featured")} /> Featured on the homepage</label>
          </div>
          <div className="actions">
            <button className="btn solid" type="submit" disabled={busy}>{busy ? "Saving…" : "Save publication"}</button>
            <button className="btn line" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="table-wrap desk-panel">
        <table>
          <thead><tr><th>Year</th><th>Title</th><th>Record</th><th></th></tr></thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item._id}>
                <td className="col-fit" data-label="Year">{item.year}</td>
                <td data-label="Title">
                  {item.title}
                  {item.featured && <span className="badge">Featured</span>}
                  {languageBadge(item)}
                  <small className="row-meta">{item.venue}</small>
                </td>
                <td className="col-fit" data-label="Record">{item.url || item.doi || item.pdf ? <span className="badge ok">Verified</span> : <span className="badge warn">Missing link</span>}</td>
                <td className="row-actions" data-label="Actions">
                  {(() => {
                    const href = doiUrl(item.doi) || safeHref(item.url);
                    return href ? <a href={href} target="_blank" rel="noopener noreferrer">Open</a> : null;
                  })()}
                  <button className="text-link" type="button" onClick={() => { setDraft({ ...item, ...editionDraft(item) }); markOpened(); }}>Edit</button>
                  <button className="danger" type="button" onClick={() => remove(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td className="table-empty" colSpan={4}>No publications match this view.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

const blankArticle = {
  kind: "review", lang: "en", author: "Dr. Adil Zaman", contentText: "", published: true,
  title: "", date: "", category: "", subtitle: "", image: "", imageAlt: "", citation: "", doi: "", slug: "",
};

function ArticlesAdmin() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const { formRef, noticeRef, markOpened } = useFormAnchor(error);
  function load() { api("/api/admin/articles").then(setItems); }
  useEffect(load, []);

  const visible = useMemo(() => items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    return `${item.title} ${item.alt?.title || ""} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [items, kind, query]);

  function field(name) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setDraft((current) => ({ ...current, [name]: value }));
    };
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const body = withEdition({ ...draft, ...contentTo(draft.contentText), published: draft.published !== false }, { article: true });
    try {
      if (draft._id) await api(`/api/admin/articles/${draft._id}`, { method: "PUT", body });
      else await api("/api/admin/articles", { method: "POST", body });
      setDraft(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this piece from the public site?")) return;
    await api(`/api/admin/articles/${id}`, { method: "DELETE" });
    if (draft?._id === id) setDraft(null);
    load();
  }

  const categories = draft?.kind === "opinion" ? OPINION_CATEGORIES : REVIEW_CATEGORIES;

  return (
    <>
      <header className="desk-head split">
        <div>
          <p className="kicker">Writing</p>
          <h1>Reviews and opinion</h1>
          <p>{visible.length} pieces</p>
        </div>
        <button className="btn solid" type="button" onClick={() => { setDraft({ ...blankArticle, date: new Date().toISOString().slice(0, 10) }); markOpened(); }}>New piece</button>
      </header>
      <div className="desk-tools">
        <input aria-label="Search writing" placeholder="Search title or category" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Kind of writing" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="">Reviews and opinion</option>
          <option value="review">Research reviews</option>
          <option value="opinion">Opinion and blogs</option>
        </select>
      </div>
      {draft && (
        <form ref={formRef} className="admin-form desk-panel" onSubmit={save}>
          {error && <p ref={noticeRef} tabIndex={-1} className="notice error" role="alert">{error}</p>}
          <div className="fields">
            <label className="field full">Title<input required value={draft.title || ""} onChange={field("title")} lang={draft.lang === "ur" ? "ur" : "en"} dir={draft.lang === "ur" ? "rtl" : "ltr"} className={draft.lang === "ur" ? "urdu-field" : undefined} /></label>
            <label className="field">Kind
              <select value={draft.kind} onChange={field("kind")}>
                <option value="review">Research review</option>
                <option value="opinion">Opinion</option>
              </select>
            </label>
            <label className="field">Date<input required type="date" value={String(draft.date || "").slice(0, 10)} onChange={field("date")} /></label>
            <label className="field">Category
              <input list="article-categories" value={draft.category || ""} onChange={field("category")} />
              <datalist id="article-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist>
            </label>
            <label className="field">Language
              <select value={draft.lang || "en"} onChange={field("lang")}>
                <option value="en">English</option>
                <option value="ur">Urdu</option>
              </select>
            </label>
            <label className="field">Author<input value={draft.author || ""} onChange={field("author")} /></label>
            <label className="field">URL slug<input value={draft.slug || ""} onChange={field("slug")} placeholder="Generated from the title if empty" /></label>
            <label className="field full">Image path<input value={draft.image || ""} onChange={field("image")} placeholder="/media/example.jpg" /></label>
            <label className="field full">Image description<input value={draft.imageAlt || ""} onChange={field("imageAlt")} /></label>
            <label className="field full">Citation<input value={draft.citation || ""} onChange={field("citation")} /></label>
            <label className="field">DOI<input value={draft.doi || ""} onChange={field("doi")} /></label>
            <label className="field full">Text
              <textarea value={draft.contentText || ""} onChange={field("contentText")} lang={draft.lang === "ur" ? "ur" : "en"} dir={draft.lang === "ur" ? "rtl" : "ltr"} className={draft.lang === "ur" ? "urdu-field" : undefined} placeholder="Paragraphs separated by a blank line. Start a line with ## to add a heading." />
            </label>
            <p className="field full note">Add the other reading language for this review or opinion. Leave its title blank if the piece exists in one language only.</p>
            <label className="field full">{draft.lang === "ur" ? "English title" : "Urdu title"}
              <input value={draft.altTitle || ""} onChange={field("altTitle")} lang={draft.lang === "ur" ? "en" : "ur"} dir={draft.lang === "ur" ? "ltr" : "rtl"} className={draft.lang === "ur" ? undefined : "urdu-field"} />
            </label>
            <label className="field full">{draft.lang === "ur" ? "English text" : "Urdu text"}
              <textarea value={draft.altText || ""} onChange={field("altText")} lang={draft.lang === "ur" ? "en" : "ur"} dir={draft.lang === "ur" ? "ltr" : "rtl"} className={draft.lang === "ur" ? undefined : "urdu-field"} placeholder="Paragraphs separated by a blank line. Start a line with ## to add a heading." />
            </label>
            <label className="field full">{draft.lang === "ur" ? "English citation" : "Urdu citation"}
              <input value={draft.altCitation || ""} onChange={field("altCitation")} lang={draft.lang === "ur" ? "en" : "ur"} dir={draft.lang === "ur" ? "ltr" : "rtl"} className={draft.lang === "ur" ? undefined : "urdu-field"} />
            </label>
            <label className="check full"><input type="checkbox" checked={draft.published !== false} onChange={field("published")} /> Published on the public site</label>
          </div>
          <div className="actions">
            <button className="btn solid" type="submit" disabled={busy}>{busy ? "Saving…" : "Save piece"}</button>
            <button className="btn line" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="table-wrap desk-panel">
        <table>
          <thead><tr><th>Date</th><th>Kind</th><th>Title</th><th></th></tr></thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item._id}>
                <td className="col-fit" data-label="Date">{String(item.date).slice(0, 10)}</td>
                <td className="col-fit" data-label="Kind">{item.kind === "review" ? "Review" : "Opinion"} {item.published === false && <span className="badge warn">Draft</span>}</td>
                <td data-label="Title">{item.title} {languageBadge(item)}<small className="row-meta">{item.category}</small></td>
                <td className="row-actions" data-label="Actions">
                  {safeHref(item.kind === "review" ? `/research-reviews/${item.slug}` : `/opinion-blogs/${item.slug}`) && (
                    <Link to={safeHref(item.kind === "review" ? `/research-reviews/${item.slug}` : `/opinion-blogs/${item.slug}`)}>View</Link>
                  )}
                  <button className="text-link" type="button" onClick={() => { setDraft({ ...item, ...editionDraft(item), contentText: contentFrom(item) }); markOpened(); }}>Edit</button>
                  <button className="danger" type="button" onClick={() => remove(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td className="table-empty" colSpan={4}>No pieces match this view.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Messages() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState("all");
  function load() { return api("/api/admin/messages").then(setItems); }
  useEffect(() => { load(); }, []);
  const visible = items.filter((item) => filter === "all" || !item.isRead);
  const open = items.find((item) => item._id === openId) || null;

  async function read(item) {
    setOpenId(item._id);
    if (!item.isRead) {
      await api(`/api/admin/messages/${item._id}/read`, { method: "PATCH" });
      load();
    }
  }
  async function remove(id) {
    if (!window.confirm("Delete this enquiry?")) return;
    await api(`/api/admin/messages/${id}`, { method: "DELETE" });
    if (openId === id) setOpenId(null);
    load();
  }

  return (
    <>
      <header className="desk-head split">
        <div>
          <p className="kicker">Enquiries</p>
          <h1>Messages</h1>
          <p>{items.filter((item) => !item.isRead).length} unread</p>
        </div>
        <div className="desk-tools">
          <button type="button" className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>All</button>
          <button type="button" className={filter === "unread" ? "is-on" : ""} onClick={() => setFilter("unread")}>Unread</button>
        </div>
      </header>
      <div className="inbox">
        <div className="inbox-list">
          {visible.length === 0 && <p className="note">The inbox is clear.</p>}
          {visible.map((item) => (
            <button type="button" key={item._id} className={item._id === openId ? "is-on" : ""} onClick={() => read(item)}>
              <strong>{item.name} {!item.isRead && <span className="badge">New</span>}</strong>
              <span>{item.subject}</span>
              <small>{String(item.createdAt).slice(0, 10)} · {item.enquiry}</small>
            </button>
          ))}
        </div>
        <article className="desk-panel message-card">
          {!open && <p className="note">Select an enquiry to read it.</p>}
          {open && (
            <>
              <p className="kicker">{open.enquiry}</p>
              <h2>{open.subject}</h2>
              <p>{open.name} · <a href={`mailto:${open.email}`}>{open.email}</a></p>
              {(open.organisation || open.country) && <p>{[open.organisation, open.country].filter(Boolean).join(", ")}</p>}
              <p>{open.message}</p>
              <div className="actions">
                <a className="btn solid" href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}>Reply by email</a>
                <button className="btn line" type="button" onClick={() => remove(open._id)}>Delete</button>
              </div>
            </>
          )}
        </article>
      </div>
    </>
  );
}

function Password() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    const data = new FormData(event.target);
    const password = String(data.get("password") || "");
    if (password !== String(data.get("confirm") || "")) {
      setError("The two new passwords do not match.");
      return;
    }
    try {
      await api("/api/admin/password", {
        method: "POST",
        body: { current: data.get("current"), password },
      });
      setStatus("Password updated. Use it the next time you sign in.");
      event.target.reset();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="admin-form desk-panel desk-narrow" onSubmit={submit}>
      <header className="desk-head">
        <p className="kicker">Security</p>
        <h1>Password</h1>
        <p>Use at least 10 characters. This replaces the password used to open the desk.</p>
      </header>
      {status && <p className="notice">{status}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <label className="field">Current password<input name="current" type="password" required autoComplete="current-password" /></label>
      <label className="field">New password<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
      <label className="field">Confirm new password<input name="confirm" type="password" required minLength={10} autoComplete="new-password" /></label>
      <button className="btn solid" type="submit">Update password</button>
    </form>
  );
}

export default function Admin() {
  useEffect(() => {
    applyRobots("noindex, nofollow");
  }, []);
  return (
    <ReadingProvider>
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<Guard />}>
        <Route index element={<Dashboard />} />
        <Route path="publications" element={<PublicationsAdmin />} />
        <Route path="articles" element={<ArticlesAdmin />} />
        <Route path="messages" element={<Messages />} />
        <Route path="password" element={<Password />} />
      </Route>
    </Routes>
    </ReadingProvider>
  );
}
