export function httpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) {
    return "";
  }
  return url.href;
}

export function isSlug(value) {
  return /^[\p{L}\p{N}-]{1,120}$/u.test(String(value || ""));
}

export function safeHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("/")
    && !raw.startsWith("//")
    && !raw.startsWith("/\\")
    && !raw.includes("\\")
    && !raw.includes("..")
  ) {
    return raw;
  }
  return httpUrl(raw);
}

export function doiUrl(doi) {
  const value = String(doi || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!/^10\.\d{4,9}\/[^\s"'<>\\]+$/i.test(value)) return "";
  return `https://doi.org/${value}`;
}

export function bareDoi(doi) {
  const url = doiUrl(doi);
  return url ? url.slice("https://doi.org/".length) : "";
}
