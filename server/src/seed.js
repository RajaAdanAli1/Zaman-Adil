import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { DEFAULT_ADMIN_PASSWORD } from "../../shared/catalog.js";
import { doiUrl, httpUrl } from "../../shared/links.js";
import { Publication, Article, User } from "./models.js";
import { publications } from "./publications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function canonicalLink(item) {
  return doiUrl(item.doi) || httpUrl(item.url) || httpUrl(item.pdf) || "";
}

export async function seedIfEmpty() {
  const pubCount = await Publication.countDocuments();
  if (pubCount === 0) {
    await Publication.insertMany(
      publications.map((item, index) => ({
        slug: item.id,
        title: item.title,
        authors: item.authors,
        year: item.year,
        venue: item.venue,
        type: item.type,
        volume: item.volume,
        issue: item.issue,
        pages: item.pages,
        doi: item.doi,
        url: item.url,
        pdf: item.pdf,
        summary: item.summary,
        featured: item.featured,
        sortOrder: index,
      }))
    );
    console.log(`Seeded ${publications.length} publications`);
  }

  const articleCount = await Article.countDocuments();
  if (articleCount === 0) {
    const file = path.join(__dirname, "..", "seed", "articles.json");
    if (!fs.existsSync(file)) {
      console.log("Article seed file not found; skipping articles");
    } else {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      await Article.insertMany(
        raw.map((item) => ({
          slug: item.slug,
          kind: item.kind,
          title: item.title,
          subtitle: item.subtitle || "",
          date: item.date,
          category: item.category || "",
          image: item.image || "",
          imageAlt: item.imageAlt || "",
          author: item.author || "Dr. Adil Zaman",
          lang: item.lang || "en",
          citation: item.citation || "",
          doi: item.doi || "",
          paragraphs: item.paragraphs || [],
          sections: item.sections || [],
          published: true,
        }))
      );
      console.log(`Seeded ${raw.length} articles`);
    }
  }

  const users = await User.countDocuments();
  if (users === 0) {
    const username = (process.env.ADMIN_USERNAME || "admin").trim() || "admin";
    const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const production = process.env.NODE_ENV === "production";
    if (production && (!process.env.ADMIN_PASSWORD || password === DEFAULT_ADMIN_PASSWORD)) {
      console.error("Production startup did not create an admin user. Set ADMIN_PASSWORD to a unique value. The built-in development password is refused.");
    } else {
      await User.create({
        username,
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: true,
        sessionVersion: 0,
      });
      console.log(`Admin user created: ${username}`);
    }
  }
  await User.updateMany({ mustChangePassword: { $exists: false } }, { $set: { mustChangePassword: true } });
}
