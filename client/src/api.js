export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    const error = new Error("The network request failed. Check your connection and try again.");
    error.status = 0;
    throw error;
  }
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  if (text && data === null) {
    const error = new Error("The server returned an unexpected response.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function formatDate(value, lang) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  const locale = lang === "ur" ? "ur-PK" : lang && lang !== "en" ? lang : "en-GB";
  try {
    return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
}

export function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function citationLine(item) {
  const authors = String(item.authors || "").replace(/\.$/, "");
  let line = `${authors}. ${item.venue}`;
  if (item.volume) {
    line += `, ${item.volume}`;
    if (item.issue) line += `(${item.issue})`;
  }
  if (item.pages) line += `, ${item.pages}`;
  return `${line}.`;
}
