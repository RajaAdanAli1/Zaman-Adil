import { useEffect, useState } from "react";
import { api, formatDate } from "../api";
import { useReading } from "../reading";

export function Comments({ slug, kind }) {
  const reading = useReading();
  const { t } = reading;
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api(`/api/comments?kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(slug)}`)
      .then((payload) => setItems(Array.isArray(payload?.items) ? payload.items : []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    setError("");
    setStatus("");
    load();
  }, [slug, kind]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.target;
    const data = new FormData(form);
    if (String(data.get("website") || "").trim()) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await api("/api/comments", {
        method: "POST",
        body: {
          kind,
          slug,
          name: data.get("name"),
          email: data.get("email"),
          body: data.get("body"),
          website: data.get("website"),
        },
      });
      form.reset();
      setStatus(t.commentThanks);
      load();
    } catch (err) {
      setError(err.message || "Unable to post the comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-heading" lang={reading.lang} dir={reading.dir}>
      <header className="comments-head">
        <p className="kicker">{t.comments}</p>
        <h2 id="comments-heading">{t.comments}</h2>
      </header>
      {items.length === 0 ? (
        <p className="note">{t.commentsEmpty}</p>
      ) : (
        <ul className="comment-list">
          {items.map((item) => (
            <li key={item.id}>
              <p className="comment-meta">
                <strong>{item.name}</strong>
                <span>{formatDate(String(item.createdAt).slice(0, 10), reading.lang)}</span>
              </p>
              <p className="comment-body">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form className="comment-form contact-form" onSubmit={submit}>
        {status && <p className="notice">{status}</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <label className="field">
          {t.commentName}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label className="field">
          {t.commentEmail}
          <input name="email" type="email" maxLength={180} autoComplete="email" />
        </label>
        <label className="field honey" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="field">
          {t.commentBody}
          <textarea name="body" required rows={5} maxLength={2000} />
        </label>
        <button className="btn solid" type="submit" disabled={busy}>
          {busy ? t.commentBusy : t.commentSubmit}
        </button>
      </form>
    </section>
  );
}
