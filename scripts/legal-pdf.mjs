import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { ISSUED, instruments } from "../client/src/legalDocuments.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "client", "public", "documents");

function writePdf(doc) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: "A4",
      margin: 64,
      info: {
        Title: doc.title,
        Author: "Dr. Adil Zaman",
        Subject: doc.description,
        Keywords: `${doc.ref}, zamanadil.com`,
        Creator: "zamanadil.com",
      },
    });
    const file = path.join(outDir, path.basename(doc.file));
    const stream = fs.createWriteStream(file);
    pdf.pipe(stream);
    const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;

    pdf.font("Times-Bold").fontSize(18).text(doc.title, { width });
    pdf.moveDown(0.35);
    pdf.font("Times-Roman").fontSize(11);
    for (const line of [
      "zamanadil.com",
      "",
      `Document: ${doc.ref}`,
      `Issued: ${ISSUED}`,
      "Author: Dr. Adil Zaman",
      "Department of Political Science and International Relations",
      "University of Gujrat, Pakistan",
      "Standing: Public notice. Correspondence under it is confidential.",
    ]) {
      pdf.text(line, { width });
    }
    pdf.moveDown(0.7);

    for (const section of doc.sections) {
      pdf.font("Times-Bold").fontSize(13).text(section.heading, { width });
      pdf.moveDown(0.35);
      pdf.font("Times-Roman").fontSize(11);
      for (const paragraph of section.paragraphs) {
        pdf.text(paragraph, { width, lineGap: 2 });
        pdf.moveDown(0.55);
      }
    }

    pdf.font("Times-Bold").fontSize(13).text("Attestation", { width });
    pdf.moveDown(0.35);
    pdf.font("Times-Roman").fontSize(11).text(
      [
        "Dr. Adil Zaman",
        "Political Scientist and Researcher",
        "Proprietor of zamanadil.com",
        `Attested on ${ISSUED} in a personal professional capacity.`,
        "This instrument is not a seal or decision of the University of Gujrat.",
        "",
        `End of document ${doc.ref}.`,
      ].join("\n"),
      { width, lineGap: 2 },
    );

    pdf.end();
    stream.on("finish", () => resolve(file));
    stream.on("error", reject);
  });
}

fs.mkdirSync(outDir, { recursive: true });
const written = await Promise.all(Object.values(instruments).map(writePdf));
for (const file of written) console.log(file);
