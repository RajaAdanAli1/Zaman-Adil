const TRACKABLE = [
  /^\/$/,
  /^\/about$/,
  /^\/expertise$/,
  /^\/publications$/,
  /^\/publications\/[\p{L}\p{N}-]{1,120}$/u,
  /^\/research-reviews$/,
  /^\/research-reviews\/[\p{L}\p{N}-]{1,120}$/u,
  /^\/opinion-blogs$/,
  /^\/opinion-blogs\/[\p{L}\p{N}-]{1,120}$/u,
  /^\/services$/,
  /^\/contact$/,
  /^\/search$/,
  /^\/privacy$/,
  /^\/disclaimer$/,
  /^\/accessibility$/,
];

export function dayKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

export function normalizeTrackPath(input) {
  if (typeof input !== "string") return "";
  let path = input.trim();
  if (!path.startsWith("/")) return "";
  path = path.split("?")[0].split("#")[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    return "";
  }
  if (!path.startsWith("/") || path.length > 180) return "";
  if (path.includes("\\") || path.includes("..") || path.includes("//")) return "";
  if (path.length > 1) path = path.replace(/\/+$/, "");
  path = path.toLowerCase();
  return TRACKABLE.some((pattern) => pattern.test(path)) ? path : "";
}

export async function incrementPageview(Pageview, path, day) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await Pageview.updateOne({ path, day }, { $inc: { views: 1 } }, { upsert: true });
      return;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  await Pageview.updateOne({ path, day }, { $inc: { views: 1 } });
}
