import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { ISSUED, PROPRIETOR, instruments } from "../client/src/legalDocuments.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "client", "public", "documents");
const INK = "#1c1914";
const MARK = "#5c4316";
const RULE = "#c4b49a";
const MARGIN = { top: 74, bottom: 68, left: 64, right: 64 };

function clauseBody(clause) {
  return typeof clause === "string" ? { text: clause, items: [] } : { text: clause.text, items: clause.items || [] };
}

function room(pdf, needed) {
  const limit = pdf.page.height - pdf.page.margins.bottom;
  if (pdf.y + needed > limit) pdf.addPage();
}

function writePdf(doc) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: "A4",
      margins: MARGIN,
      bufferPages: true,
      info: {
        Title: doc.title,
        Author: PROPRIETOR.name,
        Subject: doc.description,
        Keywords: `${doc.ref}, ${PROPRIETOR.site}`,
        Creator: PROPRIETOR.site,
      },
    });
    const file = path.join(outDir, path.basename(doc.file));
    const stream = fs.createWriteStream(file);
    pdf.pipe(stream);
    const width = pdf.page.width - MARGIN.left - MARGIN.right;

    pdf.fillColor(MARK).font("Times-Bold").fontSize(9).text("ZAMANADIL.COM", { characterSpacing: 1.4, width });
    pdf.moveDown(0.7);
    pdf.fillColor(INK).font("Times-Bold").fontSize(20).text(doc.title, { width });
    pdf.moveDown(0.45);
    pdf.strokeColor(RULE).lineWidth(0.8).moveTo(MARGIN.left, pdf.y).lineTo(MARGIN.left + width, pdf.y).stroke();
    pdf.moveDown(0.7);

    pdf.fillColor(INK).font("Times-Bold").fontSize(11).text(PROPRIETOR.name, { width });
    pdf.font("Times-Roman").fontSize(11);
    for (const line of [PROPRIETOR.department, PROPRIETOR.institution, PROPRIETOR.campus]) {
      pdf.text(line, { width });
    }
    pdf.moveDown(0.55);
    pdf.font("Times-Roman").fontSize(10).fillColor(INK);
    const meta = [
      ["Document", doc.ref],
      ["Version", doc.version],
      ["Issued", ISSUED],
      ["Status", "In force"],
      ["Standing", doc.standing],
      ["Correspondence", PROPRIETOR.email],
    ];
    for (const [label, value] of meta) {
      pdf.font("Times-Bold").text(`${label}.  `, { continued: true, width });
      pdf.font("Times-Roman").text(value, { width });
    }
    pdf.moveDown(0.7);
    pdf.font("Times-Italic").fontSize(11).fillColor(INK);
    for (const paragraph of doc.preamble) {
      pdf.text(paragraph, { width, lineGap: 2 });
      pdf.moveDown(0.45);
    }

    doc.sections.forEach((section, sectionIndex) => {
      const article = sectionIndex + 1;
      room(pdf, 78);
      pdf.moveDown(0.35);
      pdf.font("Times-Bold").fontSize(13).fillColor(INK).text(`${article}.  ${section.heading}`, { width });
      pdf.moveDown(0.4);
      section.clauses.forEach((clause, clauseIndex) => {
        const body = clauseBody(clause);
        const number = `${article}.${clauseIndex + 1}`;
        room(pdf, 48);
        pdf.font("Times-Bold").fontSize(11).fillColor(INK).text(`${number}   `, { continued: true, width });
        pdf.font("Times-Roman").text(body.text, { width, lineGap: 2 });
        body.items.forEach((item, itemIndex) => {
          const letter = String.fromCharCode(97 + itemIndex);
          pdf.moveDown(0.2);
          pdf.text(`(${letter})  ${item}`, { width, indent: 22, lineGap: 1 });
        });
        pdf.moveDown(0.45);
      });
    });

    room(pdf, 130);
    pdf.moveDown(0.4);
    pdf.strokeColor(RULE).lineWidth(0.6).moveTo(MARGIN.left, pdf.y).lineTo(MARGIN.left + width, pdf.y).stroke();
    pdf.moveDown(0.7);
    pdf.font("Times-Bold").fontSize(13).fillColor(INK).text("Attestation", { width });
    pdf.moveDown(0.4);
    pdf.font("Times-Italic").fontSize(14).text(PROPRIETOR.name, { width });
    pdf.font("Times-Roman").fontSize(11);
    pdf.text(PROPRIETOR.role, { width, lineGap: 2 });
    pdf.text(`Proprietor of ${PROPRIETOR.site}`, { width, lineGap: 2 });
    pdf.moveDown(0.35);
    pdf.text(
      `Attested on ${ISSUED} in a personal professional capacity. This instrument is not a seal or a decision of the ${PROPRIETOR.institution}.`,
      { width, lineGap: 2 },
    );
    pdf.moveDown(0.6);
    pdf.font("Times-Bold").fontSize(9).fillColor(MARK).text(`End of document ${doc.ref}.`, { characterSpacing: 0.6, width });

    const range = pdf.bufferedPageRange();
    const pageCount = range.count;
    for (let i = 0; i < pageCount; i += 1) {
      pdf.switchToPage(range.start + i);
      const savedTop = pdf.page.margins.top;
      const savedBottom = pdf.page.margins.bottom;
      pdf.page.margins.top = 0;
      pdf.page.margins.bottom = 0;
      const right = pdf.page.width - MARGIN.right;
      const foot = pdf.page.height - 36;
      pdf.save();
      pdf.strokeColor(RULE).lineWidth(0.5);
      pdf.moveTo(MARGIN.left, 46).lineTo(right, 46).stroke();
      pdf.moveTo(MARGIN.left, foot - 8).lineTo(right, foot - 8).stroke();
      pdf.font("Times-Roman").fontSize(8).fillColor(MARK);
      const header = { height: 12, lineBreak: false };
      pdf.text(PROPRIETOR.site, MARGIN.left, 30, { ...header, width: 180 });
      pdf.text(doc.ref, MARGIN.left, 30, { ...header, width: right - MARGIN.left, align: "right" });
      pdf.text(`Issued ${ISSUED}`, MARGIN.left, foot, { ...header, width: 220 });
      pdf.text(`Page ${i + 1} of ${pageCount}`, MARGIN.left, foot, {
        ...header,
        width: right - MARGIN.left,
        align: "right",
      });
      pdf.restore();
      pdf.page.margins.top = savedTop;
      pdf.page.margins.bottom = savedBottom;
    }

    pdf.end();
    stream.on("finish", () => resolve(file));
    stream.on("error", reject);
  });
}

fs.mkdirSync(outDir, { recursive: true });
const written = await Promise.all(Object.values(instruments).map(writePdf));
for (const file of written) console.log(file);
