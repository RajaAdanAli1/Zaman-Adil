function esc(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/[{}]/g, (char) => `\\${char}`)
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

function citeKey(slug) {
  const key = String(slug || "publication").replace(/[^\w:-]/g, "");
  return key || "publication";
}

export function toBibtex(items) {
  return items
    .map((item) => {
      const lines = [
        `@article{${citeKey(item.slug)},`,
        `  title = {${esc(item.title)}},`,
        `  author = {${esc(item.authors)}},`,
        `  year = {${item.year}},`,
        `  journal = {${esc(item.venue)}},`,
      ];
      if (item.volume) lines.push(`  volume = {${esc(item.volume)}},`);
      if (item.issue) lines.push(`  number = {${esc(item.issue)}},`);
      if (item.pages) lines.push(`  pages = {${esc(item.pages)}},`);
      if (item.doi) lines.push(`  doi = {${esc(item.doi)}},`);
      if (item.url) lines.push(`  url = {${esc(item.url)}},`);
      lines.push("}");
      return lines.join("\n");
    })
    .join("\n\n");
}
