import { useState } from "react";
import { ORIGIN } from "../../../shared/seo.js";
import { useReading } from "../reading";

function shareUrl(path) {
  if (typeof window !== "undefined" && window.location?.href) return window.location.href.split("#")[0];
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${ORIGIN}${clean === "/" ? "/" : clean}`;
}

export function ShareLinks({ path, title }) {
  const { t, lang } = useReading();
  const [copied, setCopied] = useState(false);
  const url = shareUrl(path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");
  const links = [
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="share-box" lang={lang !== "en" ? lang : undefined}>
      <p className="kicker">{t.share}</p>
      <div className="share-links">
        {links.map((item) => (
          <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${t.shareOn} ${item.label}`}>
            {item.label}
          </a>
        ))}
        <button type="button" onClick={copyLink}>
          {copied ? t.linkCopied : t.copyLink}
        </button>
      </div>
    </div>
  );
}
