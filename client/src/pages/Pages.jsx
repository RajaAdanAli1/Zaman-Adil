import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { safeHref } from "../../../shared/links.js";
import { enquiries, expertise, interests, services } from "../content";
import { usePage } from "../components/Chrome";
import { ReadingBar } from "../components/ReadingBar";
import { selectEdition, textLang, typeLabel } from "../../../shared/reading.js";
import { LiveText } from "../components/LiveText";
import { useReading } from "../reading";
import { ISSUED, PROPRIETOR, instruments } from "../legalDocuments";

export function About() {
  usePage("About", "Dr. Adil Zaman is a political scientist, researcher and academic specialising in elections, political behaviour, democratic institutions and South Asian politics.");
  return (
    <article>
      <header className="page-hero scene is-ready" data-scene="university">
        <div className="frame">
          <p className="eyebrow"><span>Profile</span></p>
          <h1>About Dr. Adil Zaman</h1>
        </div>
      </header>
      <div className="frame about-grid">
        <div className="prose">
          <h2>Professional Introduction</h2>
          <p>Dr. Adil Zaman is a political scientist, researcher and academic specialising in elections, political behaviour, democratic institutions and South Asian politics.</p>
          <p>He serves as a faculty member in the Department of Political Science and International Relations at the University of Gujrat, Pakistan, where he has been associated with teaching, research and academic supervision since 2014.</p>
          <p>His academic work combines political analysis with empirical research, including survey research, electoral data analysis and comparative approaches.</p>
          <p>A major strand of his research examines electoral integrity, electoral campaigns, voting behaviour, political participation and democratic institutions in Pakistan and South Asia.</p>
          <h2>Research Orientation</h2>
          <p>My research is located at the intersection of comparative politics, electoral studies and political behaviour.</p>
          <p>I am particularly interested in understanding how citizens experience elections, how political campaigns influence electoral choices, how institutions affect democratic legitimacy and how patterns of political participation vary across social and political contexts.</p>
          <p>Pakistan remains central to much of my research, while comparative analysis across South Asia provides a wider framework for understanding these political processes.</p>
          <h2>Research Interests</h2>
          <ul className="chips">{interests.map((item) => <li key={item}>{item}</li>)}</ul>
          <h2>Teaching</h2>
          <p>My teaching interests cover political science and international relations, particularly comparative politics, political institutions, international relations theory, political ideologies, parliamentary studies and the politics of South Asia.</p>
          <p>My teaching approach emphasises conceptual understanding, empirical evidence and the application of political science theories to contemporary political developments.</p>
          <h2>Research Supervision</h2>
          <p>I supervise research in political science and related areas, particularly projects involving elections, political behaviour, democratic institutions, political participation, public opinion and South Asian politics.</p>
          <p>Research supervision emphasises clear research questions, appropriate methodology, systematic analysis and the development of academically rigorous research.</p>
          <h2>Academic and Professional Engagement</h2>
          <p>My wider academic interests include research collaboration, academic publishing, research methodology, curriculum development, research consultancy and the communication of political science research to wider audiences.</p>
          <p>Through zamanadil.com, I aim to connect academic research, empirical analysis and contemporary political discussion in an accessible and professionally organised platform.</p>
          <p><Link className="btn line" to="/publications">View Publications</Link></p>
        </div>
        <aside className="sticky">
          <figure className="portrait compact">
            <img src="/media/portrait.jpg" alt="Portrait of Dr. Adil Zaman" decoding="async" />
            <figcaption>Dr. Adil Zaman</figcaption>
          </figure>
          <div className="aside-card">
            <h2>Academic base</h2>
            <p>Department of Political Science & International Relations<br />University of Gujrat<br />Pakistan</p>
            <p><a className="text-link" href="mailto:adil.zaman@uog.edu.pk">adil.zaman@uog.edu.pk</a></p>
            <p><Link className="text-link" to="/contact">Contact Dr. Adil Zaman</Link></p>
          </div>
        </aside>
      </div>
    </article>
  );
}

export function Expertise() {
  usePage("Research Expertise", "Research expertise in elections, voting behaviour, political participation, Pakistan politics, South Asia, parliament and quantitative political research.");
  return (
    <article>
      <header className="page-hero scene is-ready" data-scene="chamber">
        <div className="frame">
          <p className="eyebrow"><span>Expertise</span></p>
          <h1>Research Expertise</h1>
          <p className="lede">My research focuses primarily on electoral politics, political behaviour and democratic institutions, with Pakistan and South Asia forming the principal geographical context of much of my work.</p>
        </div>
      </header>
      <div className="frame expertise-list">
        {expertise.map(([title, text, themes], index) => (
          <section className="row-block" key={title}>
            <p className="index">{String(index + 1).padStart(2, "0")}</p>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
              {!!themes.length && <ul className="theme-list">{themes.map((theme) => <li key={theme}>{theme}</li>)}</ul>}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export function Projects() {
  const reading = useReading();
  const { t } = reading;
  const [items, setItems] = useState(null);
  usePage(t.projects, t.projectsMeta, { lang: reading.lang });

  useEffect(() => {
    api("/api/projects")
      .then((payload) => setItems(Array.isArray(payload?.items) ? payload.items : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <article>
      <header className="page-hero scene is-ready" data-scene="seminar" lang={reading.lang} dir={reading.dir}>
        <div className="frame">
          <p className="eyebrow"><span>{t.projects}</span></p>
          <h1>{t.projects}</h1>
          <p className="lede">{t.projectsLede}</p>
        </div>
      </header>
      <div className="frame page-pad">
        {items == null ? (
          <p className="note" lang={reading.lang}>{t.loading}</p>
        ) : items.length === 0 ? (
          <p className="note" lang={reading.lang}>{t.projectsEmpty}</p>
        ) : (
          <div className="project-list">
            {items.map((item) => (
              <article className="project-card" key={item.id}>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function Services() {
  usePage("Research & Academic Services", "Research design, quantitative analysis, publication support, electoral data research and academic consultancy by Dr. Adil Zaman.");
  return (
    <>
      <article>
        <header className="page-hero scene is-ready" data-scene="seminar">
          <div className="frame">
            <p className="eyebrow"><span>Services</span></p>
            <h1>Research & Academic Services</h1>
            <p className="lede">Research and academic consultancy in political science and the wider social sciences, with particular experience in quantitative research, electoral studies, political behaviour, survey research and academic publication.</p>
            <p>Services are intended for researchers, postgraduate students, academic institutions, research organisations and collaborative research teams.</p>
          </div>
        </header>
        <div className="frame service-stack">
          {services.map(([id, title, paragraphs], index) => (
            <section className="row-block" id={id} key={id}>
              <p className="index">{String(index + 1).padStart(2, "0")}</p>
              <div>
                <h2>{title}</h2>
                {paragraphs.map((paragraph) => <p key={paragraph.slice(0, 32)}>{paragraph}</p>)}
              </div>
            </section>
          ))}
          <section className="integrity" id="integrity">
            <h2>Academic Integrity</h2>
            <p>All research consultancy and academic support offered through this website is based on principles of academic integrity, transparency and responsible research practice.</p>
            <p>Services are intended to assist researchers in developing, analysing and communicating their own scholarly work. They are not intended to facilitate academic misconduct or misrepresentation of authorship.</p>
          </section>
        </div>
      </article>
      <section className="cta scene is-ready" data-scene="letters">
        <div className="frame">
          <div className="gold-rule" />
          <h2>Discuss a research requirement</h2>
          <p>For research collaboration, academic consultation, invited lectures, research projects or professional enquiries, please get in touch.</p>
          <Link className="btn light" to="/contact">Discuss a Research Requirement</Link>
        </div>
      </section>
    </>
  );
}

const emptyForm = {
  name: "",
  email: "",
  organisation: "",
  country: "",
  enquiry: "",
  subject: "",
  message: "",
  consent: false,
  website: "",
};

export function Contact() {
  usePage("Contact", "Contact Dr. Adil Zaman about academic collaboration, research consultancy, invited lectures, research projects and publication enquiries.");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const noticeRef = useRef(null);

  useEffect(() => {
    if (!error && !status) return;
    noticeRef.current?.focus();
    noticeRef.current?.scrollIntoView({ block: "nearest" });
  }, [error, status]);

  function set(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setStatus("");
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      organisation: form.organisation.trim(),
      country: form.country.trim(),
      enquiry: form.enquiry,
      subject: form.subject.trim(),
      message: form.message.trim(),
      consent: form.consent ? "1" : "",
      website: form.website,
    };
    if (!payload.name || !payload.email || !payload.enquiry || !payload.subject || !payload.message || !form.consent) {
      setError("Please complete the required fields.");
      return;
    }
    if (payload.name.length > 120 || payload.email.length > 180 || payload.subject.length > 180 || payload.message.length > 5000) {
      setError("One of the fields is too long.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/contact", { method: "POST", body: payload });
      setStatus("Your message has been sent. Dr. Adil Zaman will read it and reply when a response is appropriate.");
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article>
      <header className="page-hero scene is-ready" data-scene="letters">
        <div className="frame">
          <p className="eyebrow"><span>Correspondence</span></p>
          <h1>Contact</h1>
          <p className="lede">For academic collaboration, research consultancy, invited lectures, research projects, publication-related enquiries or other professional communication, please use the contact form.</p>
        </div>
      </header>
      <div className="frame contact-grid">
        <form className="contact-form" onSubmit={submit}>
          {(status || error) && (
            <p ref={noticeRef} tabIndex={-1} className={error ? "notice error" : "notice"} role={error ? "alert" : "status"}>
              {error || status}
            </p>
          )}
          <p className="hp"><label>Leave this field empty<input name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" /></label></p>
          <div className="fields">
            <label className="field">Name<input required value={form.name} onChange={set("name")} /></label>
            <label className="field">Email Address<input required type="email" value={form.email} onChange={set("email")} /></label>
            <label className="field">Institution / Organisation <span>optional</span><input value={form.organisation} onChange={set("organisation")} /></label>
            <label className="field">Country <span>optional</span><input value={form.country} onChange={set("country")} /></label>
            <label className="field full">Nature of Enquiry
              <select required value={form.enquiry} onChange={set("enquiry")}>
                <option value="">Select</option>
                {enquiries.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="field full">Subject<input required value={form.subject} onChange={set("subject")} /></label>
            <label className="field full">Message<textarea required value={form.message} onChange={set("message")} /></label>
            <label className="check full">
              <input type="checkbox" required checked={form.consent} onChange={set("consent")} />
              <span>I agree that this enquiry may be stored so it can be read and answered, as described in the <Link to="/privacy">Privacy Notice</Link>.</span>
            </label>
          </div>
          <button className="btn solid" type="submit" disabled={busy}>{busy ? "Sending…" : "Send Message"}</button>
        </form>
        <aside className="aside-card">
          <h2>University of Gujrat</h2>
          <p>Department of Political Science & International Relations<br />Hafiz Hayat Campus<br />Gujrat, Pakistan</p>
          <p><a className="text-link" href="mailto:adil.zaman@uog.edu.pk">adil.zaman@uog.edu.pk</a></p>
        </aside>
      </div>
    </article>
  );
}

export function SearchPage() {
  const reading = useReading();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  usePage("Search", "Search publications, research reviews and opinion on zamanadil.com.", { robots: "noindex, nofollow" });

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }
    setError("");
    api(`/api/search?q=${encodeURIComponent(q)}`)
      .then((data) => setResults(data.results))
      .catch((err) => {
        setResults([]);
        setError(err.message);
      });
  }, [q]);

  return (
    <article>
      <header className="page-hero scene is-ready" data-scene="journals">
        <div className="frame">
          <h1>Search</h1>
          <form className="search-bar" onSubmit={(event) => { event.preventDefault(); }}>
            <input aria-label="Search" value={q} onChange={(event) => setParams({ q: event.target.value })} />
          </form>
          <ReadingBar />
        </div>
      </header>
      <div className="frame page-pad">
        {error && <p className="notice error" role="alert">{error}</p>}
        {results === null && !error && <p>Searching…</p>}
        {results?.length === 0 && <p className="empty">No results yet. Try a publication title, topic or page name.</p>}
        <div className="pub-list">
          {results?.map((item) => {
            const href = safeHref(item.href);
            if (!href) return null;
            const readable = item.type === "Publication" || item.type === "Research Review" || item.type === "Opinion";
            const edition = readable ? selectEdition(item, reading.lang) : null;
            const title = edition?.title || item.title;
            const summary = edition && edition.lang !== (item.lang || "en")
              ? (edition.excerpt || edition.summary || item.summary)
              : item.summary;
            const language = textLang(title);
            const summaryLanguage = textLang(summary);
            const typeText = typeLabel(item.type, reading.lang);
            return (
            <article className="pub" key={`${item.type}-${href}`}>
              <p className="kicker">{readable ? <LiveText text={typeText} source={textLang(typeText)} /> : typeText}</p>
              <div>
                <h3 lang={language} dir={language === "ur" ? "rtl" : "ltr"}><Link to={href}>{readable ? <LiveText text={title} source={edition?.lang || textLang(title)} /> : title}</Link></h3>
                <p lang={summaryLanguage} dir={summaryLanguage === "ur" ? "rtl" : "ltr"}>{readable ? <LiveText text={summary} source={edition?.lang || textLang(summary)} /> : summary}</p>
                {safeHref(item.link) && <p><a className="text-link" href={safeHref(item.link)} target="_blank" rel="noopener noreferrer">Open verified publication</a></p>}
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function LinkedText({ text }) {
  const parts = String(text).split(/(https:\/\/[^\s)]+|adil\.zaman@uog\.edu\.pk)/g);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("https://")) {
      const clean = part.replace(/[.,;:]$/, "");
      const tail = part.slice(clean.length);
      return <span key={index}><a href={clean}>{clean}</a>{tail}</span>;
    }
    if (part.includes("@")) return <a key={index} href={`mailto:${part}`}>{part}</a>;
    return <span key={index}>{part}</span>;
  });
}

export function Legal({ kind }) {
  const doc = instruments[kind];
  usePage(doc.title, doc.description);
  const others = [
    ["/privacy", "Privacy Notice"],
    ["/disclaimer", "Academic and Editorial Disclaimer"],
    ["/accessibility", "Accessibility Statement"],
  ].filter(([href]) => href !== `/${kind}`);
  return (
    <article className="legal-page">
      <header className="page-hero scene is-ready" data-scene="letters">
        <div className="frame">
          <p className="eyebrow"><span>Public instrument</span></p>
          <h1>{doc.title}</h1>
          <p className="lede">{doc.description}</p>
        </div>
      </header>
      <div className="frame page-pad">
        <article className="deed" lang="en" aria-labelledby="deed-title">
          <header className="deed-head">
            <div className="deed-id">
              <img className="deed-seal" src="/media/logo.jpg" alt="" width="64" height="64" />
              <div>
                <p className="deed-kicker">{PROPRIETOR.site}</p>
                <p id="deed-title" className="deed-title">{doc.title}</p>
                <p className="deed-party">{PROPRIETOR.name}</p>
                <p className="deed-affil">{PROPRIETOR.department}<br />{PROPRIETOR.institution}<br />{PROPRIETOR.campus}</p>
              </div>
            </div>
            <dl className="deed-meta">
              <div><dt>Document</dt><dd>{doc.ref}</dd></div>
              <div><dt>Version</dt><dd>{doc.version}</dd></div>
              <div><dt>Issued</dt><dd>{ISSUED}</dd></div>
              <div><dt>Status</dt><dd>In force</dd></div>
              <div><dt>Standing</dt><dd>{doc.standing}</dd></div>
              <div><dt>Correspondence</dt><dd><a href={`mailto:${PROPRIETOR.email}`}>{PROPRIETOR.email}</a></dd></div>
            </dl>
            <div className="deed-actions">
              <a className="btn line" href={doc.file}>Download PDF</a>
              <p className="deed-note">The PDF is a copy for printing and filing. If this page and the PDF differ, this page is the text in force.</p>
            </div>
          </header>
          <div className="deed-preamble">
            {doc.preamble.map((paragraph) => <p key={paragraph}><LinkedText text={paragraph} /></p>)}
          </div>
          {doc.sections.map((section, sectionIndex) => {
            const article = sectionIndex + 1;
            return (
              <section key={section.heading} aria-labelledby={`art-${article}`}>
                <h2 id={`art-${article}`}>{article}. {section.heading}</h2>
                <ol className="clauses">
                  {section.clauses.map((clause, clauseIndex) => {
                    const body = typeof clause === "string" ? { text: clause } : clause;
                    const number = `${article}.${clauseIndex + 1}`;
                    return (
                      <li key={number} id={`c-${number}`}>
                        <span className="clause-no">{number}</span>
                        <div>
                          <p><LinkedText text={body.text} /></p>
                          {body.items && (
                            <ol className="clause-items">
                              {body.items.map((item, itemIndex) => (
                                <li key={`${number}-${itemIndex}`}>
                                  <span>({String.fromCharCode(97 + itemIndex)})</span>
                                  <span><LinkedText text={item} /></span>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
          <footer className="deed-sign">
            <h2>Attestation</h2>
            <p className="sign-name">{PROPRIETOR.name}</p>
            <p>{PROPRIETOR.role}</p>
            <p>Proprietor of {PROPRIETOR.site}</p>
            <p>Attested on {ISSUED} in a personal professional capacity. This instrument is not a seal or a decision of the {PROPRIETOR.institution}.</p>
            <p className="deed-end">End of document {doc.ref}.</p>
          </footer>
          <nav className="deed-related" aria-label="Related instruments">
            <p>Related instruments</p>
            {others.map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}
          </nav>
        </article>
      </div>
    </article>
  );
}

export function NotFound() {
  usePage("Page not found", "The requested page is not available.", { robots: "noindex, follow" });
  return (
    <article className="page-hero">
      <div className="frame">
        <h1>This page could not be found.</h1>
        <p><Link className="btn line" to="/">Return home</Link></p>
      </div>
    </article>
  );
}
