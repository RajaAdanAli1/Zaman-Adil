import express from "express";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { applyTemplate, resolveDocument, robotsTxt, sitemapXml } from "./seo.js";
import { csrfProtection, originAllowed, securityHeaders } from "./security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

  app.use(securityHeaders);
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && originAllowed(origin, req)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  });
  app.use(express.json({ limit: "512kb" }));
  app.use(cookieParser());
  app.use(csrfProtection);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/admin", adminRoutes);
  app.use("/api", publicRoutes);
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(robotsTxt());
  });

  app.get("/sitemap.xml", async (_req, res, next) => {
    try {
      res.type("application/xml").send(await sitemapXml());
    } catch (error) {
      next(error);
    }
  });

  const clientDist = path.join(__dirname, "..", "..", "client", "dist");
  const clientIndex = path.join(clientDist, "index.html");
  if (fs.existsSync(clientIndex)) {
    app.use(express.static(clientDist, { index: false, maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));
    app.get("*", async (req, res, next) => {
      try {
        if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found." });
        if (req.path.length > 1 && req.path.endsWith("/") && !path.extname(req.path)) {
          return res.redirect(301, req.path.replace(/\/+$/, "") || "/");
        }
        if (path.extname(req.path)) return res.status(404).end();
        const template = fs.readFileSync(clientIndex, "utf8");
        const document = await resolveDocument(req.path);
        if (document.robotsHeader) res.setHeader("X-Robots-Tag", document.robotsHeader);
        res.status(document.status).type("html").send(applyTemplate(template, document));
      } catch (error) {
        next(error);
      }
    });
  }

  app.use((error, _req, res, _next) => {
    const status = error?.type === "entity.parse.failed" || error?.name === "SyntaxError"
      ? 400
      : error?.type === "entity.too.large" || error?.status === 413
        ? 413
        : error?.name === "ValidationError" || error?.name === "CastError"
          ? 400
          : error?.code === 11000
            ? 409
            : error?.status && error.status < 500
              ? error.status
              : 500;
    if (status >= 500) console.error(error?.name || "Error", error?.message || "request failed");
    const message = status === 409
      ? "That record already exists."
      : status === 413
        ? "That request is too large."
        : status === 400
          ? (error?.name === "ValidationError" || error?.name === "CastError"
            ? "The submitted record is not valid."
            : "The request could not be read.")
          : "The server could not complete that request.";
    if (res.headersSent) return;
    res.status(status).json({ error: message });
  });

  return app;
}
