export function contentFrom(article) {
  const blocks = [...(article.paragraphs || [])];
  (article.sections || []).forEach((section) => {
    blocks.push(`## ${section.heading}`);
    blocks.push(...(section.paragraphs || []));
  });
  return blocks.join("\n\n");
}

export function contentTo(text) {
  const paragraphs = [];
  const sections = [];
  let current = null;
  String(text || "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((block) => {
      if (block.startsWith("## ")) {
        current = { heading: block.slice(3).trim(), paragraphs: [] };
        sections.push(current);
      } else if (current) current.paragraphs.push(block);
      else paragraphs.push(block);
    });
  return { paragraphs, sections };
}
