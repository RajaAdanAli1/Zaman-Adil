import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { usePage } from "../components/Chrome";
import { PublicationCard } from "../components/Cards";
import { ReadingBar } from "../components/ReadingBar";
import { breadcrumbNode, itemListNode, readBootstrap, scholarlyNode } from "../seo";
import { doiUrl, safeHref } from "../../../shared/links.js";
import { selectEdition, textLang, typeHeading, typeName } from "../../../shared/reading.js";
import { LiveText } from "../components/LiveText";
import { useReading } from "../reading";

export default function Publications() {
  const reading = useReading();
  const { t } = reading;
  const [data, setData] = useState(() => {
    const cached = readBootstrap();
    return cached?.path === "/publications" && Array.isArray(cached.items) ? cached : null;
  });
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  usePage(
    t.publications,
    t.pubMeta,
    data?.items ? { lang: reading.lang, jsonLd: [itemListNode(data.items, (item) => `/publications/${item.id}`)] } : { lang: reading.lang }
  );

  useEffect(() => {
    api("/api/publications").then(setData).catch(() => setData({ items: [], years: [], types: [] }));
  }, []);

  const items = useMemo(() => {
    return (data?.items || []).filter((item) => {
      if (year && String(item.year) !== String(year)) return false;
      if (type && item.type !== type) return false;
      return true;
    });
  }, [data, year, type]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const list = map.get(item.type) || [];
      list.push(item);
      map.set(item.type, list);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <article>
      <header className="page-hero scene" data-scene="journals" lang={reading.lang} dir={reading.dir}>
        <div className="frame">
          <p className="eyebrow"><span>{t.archive}</span></p>
          <h1>{t.publications}</h1>
          <p className="lede">{t.pubLede}</p>
          <p className="note">{t.pubNote}</p>
          <ReadingBar />
          <p><a className="text-link" href="/api/publications/bibtex" lang={reading.lang !== "en" ? reading.lang : undefined}>{t.downloadBib}</a></p>
        </div>
      </header>
      <div className="frame page-pad">
        <div className="filters" aria-label={t.filterPublications}>
          <button type="button" className={year === "" ? "is-on" : ""} onClick={() => setYear("")} lang={reading.lang !== "en" ? reading.lang : undefined}>{t.allYears}</button>
          {(data?.years || []).map((option) => (
            <button type="button" key={option} className={String(year) === String(option) ? "is-on" : ""} onClick={() => setYear(option)}>
              {option}
            </button>
          ))}
        </div>
        <div className="filters" aria-label={t.filterTypes}>
          <button type="button" className={type === "" ? "is-on" : ""} onClick={() => setType("")} lang={reading.lang !== "en" ? reading.lang : undefined}>{t.allTypes}</button>
          {(data?.types || []).map((option) => {
            const label = typeName(option, reading.lang);
            return (
              <button type="button" key={option} className={type === option ? "is-on" : ""} onClick={() => setType(option)}>
                <LiveText text={label} source={textLang(label)} />
              </button>
            );
          })}
        </div>
        <p className="count" lang={reading.lang} dir={reading.dir}>{t.count(items.length)}</p>
        {!groups.length && <p className="empty" lang={reading.lang} dir={reading.dir}>{t.emptyPublications}</p>}
        {groups.map(([group, list]) => (
          <section className="pub-group" key={group} lang={reading.lang} dir={reading.dir}>
            <h2><LiveText text={typeHeading(group, reading.lang)} source={textLang(typeHeading(group, reading.lang))} /></h2>
            <div className="pub-list">
              {list.map((item) => <PublicationCard key={item.id} item={item} />)}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export function PublicationPage() {
  const reading = useReading();
  const { t } = reading;
  const { slug } = useParams();
  const [item, setItem] = useState(() => {
    const cached = readBootstrap();
    return cached?.path === `/publications/${slug}` ? cached.item : null;
  });
  const [missing, setMissing] = useState(() => {
    const cached = readBootstrap();
    return Boolean(cached?.path === `/publications/${slug}` && cached.missing);
  });

  useEffect(() => {
    const cached = readBootstrap();
    if (cached?.path === `/publications/${slug}`) {
      if (cached.missing) {
        setItem(null);
        setMissing(true);
        return;
      }
      if (cached.item) {
        setItem(cached.item);
        setMissing(false);
        return;
      }
    }
    setItem(null);
    setMissing(false);
    api(`/api/publications/${encodeURIComponent(slug)}`)
      .then((payload) => setItem(payload.item))
      .catch(() => setMissing(true));
  }, [slug]);

  const edition = item ? selectEdition(item, reading.lang) : null;
  const description = edition
    ? edition.summary || item.summary || `${item.authors}. ${item.venue} (${item.year}).`
    : missing
      ? t.notFoundPublication
      : null;
  usePage(
    edition ? edition.title : missing ? t.notFoundPage : null,
    description,
    edition
      ? {
          lang: edition.lang,
          ogType: "article",
          jsonLd: [
            scholarlyNode({ ...item, title: edition.title, summary: edition.summary || item.summary, lang: edition.lang }),
            breadcrumbNode([
              { name: t.home, path: "/" },
              { name: t.publications, path: "/publications" },
              { name: edition.title, path: `/publications/${item.id}` },
            ]),
          ],
        }
      : missing
        ? { robots: "noindex, follow", lang: reading.lang }
        : undefined
  );

  if (missing) {
    return (
      <article className="page-hero" lang={reading.lang} dir={reading.dir}>
        <div className="frame">
          <h1>{t.notFoundPublication}</h1>
          <p><Link className="btn line" to="/publications">{t.backToPublications}</Link></p>
        </div>
      </article>
    );
  }
  if (!item || !edition) return <article className="page-hero frame"><p lang={reading.lang}>{t.loading}</p></article>;

  const source = safeHref(item.link) || safeHref(item.url) || doiUrl(item.doi);
  return (
    <article>
      <header className="page-hero scene" data-scene="journals">
        <div className="frame">
          <ReadingBar />
          <p className="breadcrumb" lang={reading.lang} dir={reading.dir}><Link to="/">{t.home}</Link> / <Link to="/publications">{t.publications}</Link></p>
          <p className="kicker"><LiveText text={typeName(item.type, reading.lang)} source={textLang(typeName(item.type, reading.lang))} /> · {item.year}</p>
          <LiveText as="h1" text={edition.title} source={edition.lang} />
          <p className="lede" lang="en">{item.authors}. <em>{item.venue}</em>{item.volume ? `, ${item.volume}` : ""}{item.issue ? `(${item.issue})` : ""}{item.pages ? `, ${item.pages}` : ""}.</p>
        </div>
      </header>
      <div className={`frame measure prose page-pad${reading.lang === "ur" ? " is-urdu" : ""}`} lang={reading.lang} dir={reading.dir}>
        {(edition.summary || item.summary) && <LiveText as="p" text={edition.summary || item.summary} source={edition.lang} />}
        <div className="actions">
          {source && <a className="btn line" href={source} target="_blank" rel="noopener noreferrer" lang={reading.lang !== "en" ? reading.lang : undefined}>{t.publisherRecord}</a>}
          {doiUrl(item.doi) && (
            <a className="text-link" href={doiUrl(item.doi)} target="_blank" rel="noopener noreferrer">doi.org/{item.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}</a>
          )}
        </div>
      </div>
    </article>
  );
}
