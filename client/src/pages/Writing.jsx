import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatDate } from "../api";
import { bareDoi, doiUrl, safeHref } from "../../../shared/links.js";
import { usePage } from "../components/Chrome";
import { StoryCard } from "../components/Cards";
import { LanguageMenu } from "../components/LanguageMenu";
import { ReadingBar } from "../components/ReadingBar";
import { contentLanguages } from "../../../shared/seo.js";
import { articleNode, breadcrumbNode, itemListNode, readBootstrap } from "../seo";
import { categoryLabel, dirFor, readingMinutes, selectEdition, textLang } from "../../../shared/reading.js";
import { LiveText, useLiveText } from "../components/LiveText";
import { useReading } from "../reading";

export function Archive({ kind }) {
  const reading = useReading();
  const { t } = reading;
  const isReview = kind === "review";
  const path = isReview ? "/research-reviews" : "/opinion-blogs";
  const [data, setData] = useState(() => {
    const cached = readBootstrap();
    return cached?.path === path && Array.isArray(cached.items) ? cached : null;
  });
  const [category, setCategory] = useState("");
  usePage(
    isReview ? t.reviews : t.opinion,
    isReview ? t.reviewMeta : t.opinionMeta,
    {
      lang: reading.lang,
      ...(!category && data?.items ? { jsonLd: [itemListNode(data.items, (item) => `${path}/${item.slug}`)] } : {}),
    }
  );

  useEffect(() => {
    const query = new URLSearchParams({ kind });
    if (category) query.set("category", category);
    api(`/api/articles?${query}`).then(setData).catch(() => setData({ items: [], categories: [] }));
  }, [kind, category]);

  return (
    <article>
      <header className="page-hero scene is-ready" data-scene={isReview ? "reading" : "editorial"} lang={reading.lang} dir={reading.dir}>
        <div className="frame">
          <div className="reading-switch"><LanguageMenu align="end" /></div>
          <p className="eyebrow"><span>{isReview ? t.reviewsEyebrow : t.commentary}</span></p>
          <h1>{isReview ? t.reviews : t.opinion}</h1>
          <p className="lede">{isReview ? t.reviewLede : t.opinionLede}</p>
          <ReadingBar />
        </div>
      </header>
      <div className="frame page-pad">
        <nav className="filters" aria-label={t.categories}>
          <button type="button" className={category === "" ? "is-on" : ""} onClick={() => setCategory("")} lang={reading.lang !== "en" ? reading.lang : undefined}>{t.all}</button>
          {(data?.categories || []).map((item) => {
            const label = categoryLabel(item, reading.lang);
            return (
              <button type="button" key={item} className={category === item ? "is-on" : ""} onClick={() => setCategory(item)}>
                <LiveText text={label} source={textLang(label)} />
              </button>
            );
          })}
        </nav>
        <div className="story-grid">
          {(data?.items || []).map((article) => <StoryCard key={article.slug} article={article} kind={kind} />)}
        </div>
      </div>
    </article>
  );
}

function sideQuote(paragraphs) {
  const source = paragraphs.find((paragraph, index) => index > 0 && paragraph.length > 120) || paragraphs[0] || "";
  const sentence = source.match(/^[\s\S]{40,220}?[.۔]/);
  return sentence ? sentence[0] : source.slice(0, 180).trim();
}

function LiveOpening({ text, source }) {
  const reading = useReading();
  const live = useLiveText(text, source);
  const shown = !text || live.pending || live.failed || reading.lang === source ? source : reading.lang;
  const latin = /^\s*[A-Za-zÀ-ÖØ-öø-ÿ]/.test(live.text || "");
  if (!latin || live.pending) {
    return <p className="essay-lede live-copy" lang={shown} dir={dirFor(shown)}>{live.text}</p>;
  }
  return (
    <div className="live-copy" lang={shown} dir={dirFor(shown)}>
      <Opening text={live.text} />
    </div>
  );
}

function Opening({ text }) {
  const parts = text.match(/^(\S)(\S*)([\s\S]*)$/);
  if (!parts) return <p className="essay-lede">{text}</p>;
  return (
    <p className="essay-lede">
      {parts[1]}
      {parts[2] && <span className="essay-caps">{parts[2]}</span>}
      {parts[3]}
    </p>
  );
}

function ArticleFigure({ article, urdu }) {
  const [failed, setFailed] = useState(false);
  const image = safeHref(article.image);
  if (!image || failed) {
    return (
      <figure className={`essay-figure${urdu ? " is-urdu" : ""}`}>
        <div className="article-cover cover"><span>{article.category}</span></div>
      </figure>
    );
  }
  return (
    <figure className={`essay-figure${urdu ? " is-urdu" : ""}`}>
      <img src={image} alt={article.imageAlt || article.title} decoding="async" onError={() => setFailed(true)} />
      {article.imageAlt && <figcaption>{article.imageAlt}</figcaption>}
    </figure>
  );
}

export function ArticlePage({ kind }) {
  const reading = useReading();
  const { t } = reading;
  const { slug } = useParams();
  const base = kind === "review" ? "/research-reviews" : "/opinion-blogs";
  const label = kind === "review" ? t.reviews : t.opinion;
  const [data, setData] = useState(() => {
    const cached = readBootstrap();
    return cached?.path === `${base}/${slug}` && cached.article ? { article: cached.article, related: cached.related || [] } : null;
  });
  const [missing, setMissing] = useState(() => {
    const cached = readBootstrap();
    return Boolean(cached?.path === `${base}/${slug}` && cached.missing);
  });
  const [progress, setProgress] = useState(0);
  const article = data?.article;
  const edition = article ? selectEdition(article, reading.lang) : null;

  usePage(
    edition ? edition.title : missing ? t.notFoundPage : null,
    edition ? edition.excerpt || edition.subtitle || article.excerpt : missing ? t.notFoundPage : null,
    edition
      ? {
          ogType: "article",
          image: article.image,
          imageAlt: article.imageAlt || edition.title,
          lang: edition.lang,
          languages: contentLanguages(article.lang, article.alt?.lang),
          jsonLd: [
            articleNode({ ...article, title: edition.title, excerpt: edition.excerpt || article.excerpt, lang: edition.lang }, `${base}/${article.slug}`),
            breadcrumbNode([
              { name: t.home, path: "/" },
              { name: label, path: base },
              { name: edition.title, path: `${base}/${article.slug}` },
            ]),
          ],
        }
      : missing
        ? { robots: "noindex, follow", lang: reading.lang }
        : undefined
  );

  useEffect(() => {
    const cached = readBootstrap();
    if (cached?.path === `${base}/${slug}`) {
      if (cached.missing) {
        setData(null);
        setMissing(true);
        return;
      }
      if (cached.article) {
        setData({ article: cached.article, related: cached.related || [] });
        setMissing(false);
        return;
      }
    }
    setMissing(false);
    setData(null);
    api(`/api/articles/${encodeURIComponent(slug)}?kind=${encodeURIComponent(kind)}`)
      .then((payload) => {
        if (!payload?.article || payload.article.kind !== kind) {
          setMissing(true);
          return;
        }
        setData(payload);
      })
      .catch(() => setMissing(true));
  }, [slug, base]);

  useEffect(() => {
    function onScroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? (window.scrollY / height) * 100 : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  if (missing) {
    return (
      <article className="page-hero frame" lang={reading.lang} dir={reading.dir}>
        <h1>{t.notFoundPage}</h1>
      </article>
    );
  }
  if (!article || !edition) return <article className="page-hero frame"><p lang={reading.lang}>{t.loading}</p></article>;

  const urdu = reading.lang === "ur";
  const rtl = reading.dir === "rtl";
  const related = data.related || [];
  const citation = edition.citation || article.citation || "";
  const citationLanguage = textLang(citation);
  const hasSide = Boolean(citation) || related.length > 0;
  const minutes = edition.lang === article.lang ? article.readingMinutes : readingMinutes(edition);
  const category = categoryLabel(article.category, reading.lang);

  return (
    <article className={`essay${hasSide ? " has-side" : ""}${urdu ? " is-urdu" : ""}${rtl ? " is-rtl" : ""}`} lang={reading.lang} dir={reading.dir}>
      <div className="progress" style={{ width: `${progress}%` }} />
      <header className="page-hero scene is-ready essay-hero" data-scene={kind === "review" ? "reading" : "editorial"}>
        <div className="frame">
          <div className={`essay-intro${urdu ? " is-urdu" : ""}`}>
          <div className="reading-switch"><LanguageMenu align="end" /></div>
          <ReadingBar />
          <p className="breadcrumb" lang={reading.lang} dir={reading.dir}><Link to="/">{t.home}</Link> / <Link to={base}>{label}</Link></p>
          <p className="kicker"><LiveText text={category} source={textLang(category)} /></p>
          <LiveText as="h1" className="essay-title" text={edition.title} source={edition.lang} />
          <p className="essay-byline">
            <strong lang="en">{article.author}</strong>
            <span lang={reading.lang !== "en" ? reading.lang : undefined}>{formatDate(article.date, reading.lang)}</span>
            <span lang={reading.lang !== "en" ? reading.lang : undefined}>{t.minRead(minutes)}</span>
          </p>
          </div>
        </div>
      </header>
      <div className={`frame essay-sheet${urdu ? " is-urdu" : ""}`}>
        <ArticleFigure article={article} urdu={urdu} />
        <div className={`essay-read${hasSide ? " has-side" : ""}`}>
          <div className="essay-column">
          <div className="essay-body" lang={reading.lang} dir={reading.dir}>
            {(edition.paragraphs || []).map((paragraph, index) => (
              index === 0
                ? <LiveOpening key={paragraph.slice(0, 48)} text={paragraph} source={edition.lang} />
                : <LiveText as="p" key={paragraph.slice(0, 48)} text={paragraph} source={edition.lang} />
            ))}
            {(edition.sections || []).map((section) => (
              <section key={section.heading}>
                <LiveText as="h2" text={section.heading} source={edition.lang} />
                {(section.paragraphs || []).map((paragraph) => (
                  <LiveText as="p" key={paragraph.slice(0, 48)} text={paragraph} source={edition.lang} />
                ))}
              </section>
            ))}
          </div>
          </div>
          {hasSide && (
            <aside className="essay-side">
              {!citation && (edition.paragraphs || []).length > 1 && (
                <LiveText as="blockquote" className="essay-pull" text={sideQuote(edition.paragraphs)} source={edition.lang} />
              )}
              {citation && (
                <div className="essay-source">
                  <p className="kicker" lang={reading.lang !== "en" ? reading.lang : undefined}>{kind === "review" ? t.reviewedStudy : t.source}</p>
                  <p lang={citationLanguage} dir={citationLanguage === "ur" ? "rtl" : "ltr"}>{citation}</p>
                  {doiUrl(article.doi) && (
                    <a href={doiUrl(article.doi)} target="_blank" rel="noopener noreferrer">
                      doi.org/{bareDoi(article.doi)}
                    </a>
                  )}
                </div>
              )}
              {!!related.length && (
                <nav className="essay-more" aria-label={t.continueReading}>
                  <p className="kicker" lang={reading.lang !== "en" ? reading.lang : undefined}>{t.continueReading}</p>
                  <ul>
                    {related.map((item) => {
                      const href = safeHref(`${base}/${item.slug}`);
                      if (!href) return null;
                      const relatedEdition = selectEdition(item, reading.lang);
                      const relatedCategory = categoryLabel(item.category, reading.lang);
                      return (
                      <li key={item.slug}>
                        <Link to={href}>
                          <LiveText text={relatedCategory} source={textLang(relatedCategory)} />
                          <LiveText text={relatedEdition.title} source={relatedEdition.lang} />
                        </Link>
                      </li>
                      );
                    })}
                  </ul>
                </nav>
              )}
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
