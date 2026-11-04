import express from "express";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { clientDist, clientIndex } from "./paths.js";
import { publicError } from "./redact.js";
import { ORIGIN } from "../../shared/seo.js";
import { applyTemplate, pagesSitemapXml, publicationsSitemapXml, resolveDocument, robotsTxt, sitemapIndexXml, writingSitemapXml } from "./seo.js";
import { csrfProtection, originAllowed, securityHeaders, trustProxySetting } from "./security.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  const proxyHops = trustProxySetting();
  if (proxyHops) app.set("trust proxy", proxyHops);

  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "production" || req.hostname !== "www.zamanadil.com") return next();
    const status = req.method === "GET" || req.method === "HEAD" ? 301 : 308;
    return res.redirect(status, `${ORIGIN}${req.originalUrl}`);
  });

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
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/admin", adminRoutes);
  app.use("/api", publicRoutes);
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  function sendText(res, type, body) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type(type).send(body);
  }

  app.get("/robots.txt", (_req, res) => {
    sendText(res, "text/plain", robotsTxt());
  });

  app.get("/sitemap.xml", (_req, res) => {
    sendText(res, "application/xml", sitemapIndexXml());
  });

  app.get("/sitemap-pages.xml", (_req, res) => {
    sendText(res, "application/xml", pagesSitemapXml());
  });

  app.get("/sitemap-publications.xml", async (_req, res, next) => {
    try {
      sendText(res, "application/xml", await publicationsSitemapXml());
    } catch (error) {
      next(error);
    }
  });

  app.get("/sitemap-writing.xml", async (_req, res, next) => {
    try {
      sendText(res, "application/xml", await writingSitemapXml());
    } catch (error) {
      next(error);
    }
  });

  if (fs.existsSync(clientIndex)) {
    const production = process.env.NODE_ENV === "production";
    app.use(express.static(clientDist, {
      index: false,
      dotfiles: "ignore",
      redirect: false,
      maxAge: production ? "1h" : 0,
      setHeaders(res, filePath) {
        if (!production) return;
        if (filePath.endsWith(`${path.sep}index.html`)) {
          res.setHeader("Cache-Control", "no-cache");
          return;
        }
        if (filePath.split(path.sep).includes("assets")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }));
    app.get("*", async (req, res, next) => {
      try {
        if (req.path === "/api" || req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found." });
        if (req.path.includes("\0") || req.path.includes("..")) return res.status(404).end();
        if (req.path.length > 1 && req.path.endsWith("/") && !path.extname(req.path)) {
          return res.redirect(301, req.path.replace(/\/+$/, "") || "/");
        }
        if (path.extname(req.path)) return res.status(404).end();
        const template = fs.readFileSync(clientIndex, "utf8");
        const document = await resolveDocument(req.path);
        if (document.robotsHeader) res.setHeader("X-Robots-Tag", document.robotsHeader);
        res.setHeader("Cache-Control", "no-cache");
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
    if (status >= 500) console.error(error?.name || "Error", publicError(error));
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
