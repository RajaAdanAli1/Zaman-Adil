const loaded = new Set();

const READING = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Source+Serif+4:opsz,wght@8..60,460&display=swap";
const NASTALIQ = "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@500&display=swap";
const NASKH = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@500&display=swap";
const ARABIC = new Set(["ar", "fa", "ps", "sd"]);

function loadStylesheet(href) {
  if (loaded.has(href) || document.querySelector(`link[href="${href}"]`)) {
    loaded.add(href);
    return;
  }
  loaded.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export function loadReadingFonts() {
  loadStylesheet(READING);
}

export function loadScriptFont(lang) {
  if (lang === "ur") loadStylesheet(NASTALIQ);
  else if (ARABIC.has(lang)) loadStylesheet(NASKH);
}
