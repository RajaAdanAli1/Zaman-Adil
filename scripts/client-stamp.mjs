import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "client", "dist");
const stampFile = path.join(distDir, ".source-stamp");
const textExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".svg", ".json", ".md", ".txt", ".xml"]);

function collect(dir, files) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, files);
    else if (entry.isFile()) files.push(full);
  }
}

function stampBytes(file) {
  const bytes = fs.readFileSync(file);
  if (!textExtensions.has(path.extname(file).toLowerCase())) return bytes;
  return Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"));
}

export function clientSourceStamp() {
  const files = [
    path.join(root, "client", "index.html"),
    path.join(root, "client", "package.json"),
    path.join(root, "client", "vite.config.js"),
  ];
  collect(path.join(root, "client", "src"), files);
  collect(path.join(root, "client", "public"), files);
  files.sort((left, right) => left.localeCompare(right));
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    hash.update(relative);
    hash.update("\0");
    hash.update(stampBytes(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function clientBuildIsCurrent() {
  if (!fs.existsSync(path.join(distDir, "index.html")) || !fs.existsSync(stampFile)) return false;
  return fs.readFileSync(stampFile, "utf8").trim() === clientSourceStamp();
}

export function writeClientStamp() {
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(stampFile, `${clientSourceStamp()}\n`);
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entry) writeClientStamp();
