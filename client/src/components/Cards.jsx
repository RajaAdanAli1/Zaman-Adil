import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDate, hostLabel } from "../api";
import { doiUrl, safeHref } from "../../../shared/links.js";
import { categoryLabel, languageMark, selectEdition, textLang, typeName } from "../../../shared/reading.js";
import { LiveText } from "./LiveText";
import { useReading } from "../reading";

function cite(item) {
  const authors = String(item.authors || "").replace(/\.$/, "");
  let detail = "";
  if (item.volume) {
    detail += `, ${item.volume}`;
    if (item.issue) detail += `(${item.issue})`;
  }
  if (item.pages) detail += `, ${item.pages}`;
  return { authors, detail };
}

function LanguageMark({ item }) {
  const reading = useReading();
  const mark = languageMark(item, reading.lang);
  if (!mark) return null;
  return <span className="lang-mark" lang={mark.lang} title={mark.label}>{mark.text}</span>;
}

export function PublicationCard({ item }) {
  const reading = useReading();
  const edition = selectEdition(item, reading.lang);
  const source = safeHref(item.link) || safeHref(item.url) || doiUrl(item.doi);
  const cited = cite(item);
  return (
    <article className="pub" id={item.id}>
      <p className="pub-year">{item.year}</p>
      <div>
        <div className="kicker-row">
          <p className="kicker"><LiveText text={typeName(item.type, reading.lang)} source={textLang(typeName(item.type, reading.lang))} /></p>
          <LanguageMark item={item} />
          {item.verified && source && (
            <a className="verified" href={source} target="_blank" rel="noopener noreferrer">
              <i aria-hidden="true">✓</i> {reading.t.verified}
            </a>
          )}
        </div>
        <h3><Link to={`/publications/${item.id}`}><LiveText text={edition.title} source={edition.lang} /></Link></h3>
        <p className="cite">
          {cited.authors}. <em>{item.venue}</em>{cited.detail}.
        </p>
        {edition.summary && <LiveText as="p" text={edition.summary} source={edition.lang} />}
        <div className="pub-links">
          {safeHref(item.url) && (
            <a className="btn line small" href={safeHref(item.url)} target="_blank" rel="noopener noreferrer" lang={reading.lang !== "en" ? reading.lang : undefined}>{reading.t.viewPublication}</a>
          )}
          {doiUrl(item.doi) && (
            <a className="text-link" href={doiUrl(item.doi)} target="_blank" rel="noopener noreferrer">
              doi.org/{item.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}
            </a>
          )}
          {safeHref(item.pdf) && safeHref(item.pdf) !== safeHref(item.url) && (
            <a className="text-link" href={safeHref(item.pdf)} target="_blank" rel="noopener noreferrer">{reading.t.pdf}</a>
          )}
        </div>
        {source && <p className="source">{reading.t.publisherRecord} · {hostLabel(item.url || source)}</p>}
      </div>
    </article>
  );
}

function Cover({ article }) {
  const [failed, setFailed] = useState(false);
  const image = safeHref(article.image);
  if (!image || failed) {
    return (
      <span className="cover">
        <span><LiveText text={article.category} source="en" /></span>
      </span>
    );
  }
  return <img src={image} alt={article.imageAlt || article.title} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function tilt(event) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  el.style.setProperty("--sx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
}

function untilt(event) {
  event.currentTarget.style.transform = "";
}

export function StoryCard({ article, kind = article.kind }) {
  const reading = useReading();
  const edition = selectEdition(article, reading.lang);
  const href = safeHref(`${kind === "review" ? "/research-reviews" : "/opinion-blogs"}/${article.slug}`) || (kind === "review" ? "/research-reviews" : "/opinion-blogs");
  const label = kind === "review" ? reading.t.readReview : reading.t.readArticle;
  const category = categoryLabel(article.category, reading.lang);
  const preview = edition.lang === article.lang ? article.excerpt : (edition.excerpt || article.excerpt);
  return (
    <article className={`story-card ${kind === "review" ? "story-review" : "story-opinion"}`} lang={edition.lang === "ur" ? "ur" : undefined} onPointerMove={tilt} onPointerLeave={untilt}>
      <Link className="story-media" to={href} tabIndex={-1} aria-hidden="true">
        <Cover article={article} />
      </Link>
      <div className="story-body">
        <p className="kicker-row">
          <span className="kicker"><LiveText text={category} source={textLang(category)} /></span>
          <LanguageMark item={article} />
        </p>
        <h3><Link to={href}><LiveText text={edition.title} source={edition.lang} /></Link></h3>
        <p className="meta-line">
          {kind === "opinion" ? `${article.author} · ` : ""}
          <span lang={reading.lang !== "en" ? reading.lang : undefined}>{formatDate(article.date, reading.lang)}</span>
        </p>
        {preview && <LiveText as="p" text={preview} source={edition.lang} />}
        <Link className="text-link" to={href} lang={reading.lang !== "en" ? reading.lang : undefined}>{label}</Link>
      </div>
    </article>
  );
}
