import express from "express";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { databaseReady } from "./db.js";
import { clientDist, clientIndex } from "./paths.js";
import { publicError } from "./redact.js";
import { ORIGIN } from "../../shared/seo.js";
import { applyTemplate, documentMarkdown, llmsTxt, pagesSitemapXml, publicationsSitemapXml, resolveDocument, robotsTxt, sitemapIndexXml, writingSitemapXml } from "./seo.js";
import { handleMcp, mcpServerCard } from "./mcp.js";
import { csrfProtection, originAllowed, securityHeaders, trustProxySetting } from "./security.js";

const LEGACY_SLUG_REDIRECTS = {
    "/research-reviews/a-scientific-approach-to-measure-public-political-participation-in-pakistan":
          "/research-reviews/measuring-political-participation-pakistan",
    "/research-reviews/analysis-of-determinants-of-voter-turnout-in-indian-states-for-election-years-19912019":
          "/research-reviews/voter-turnout-determinants-indian-states-1991-2019",
    "/research-reviews/digital-citizen-empowerment-a-systematic-literature-review-of-theories-and-development-models":
          "/research-reviews/digital-citizen-empowerment-literature-review",
    "/research-reviews/effects-of-sociodemographic-variables-and-facebook-group-membership-on-students-political-participation":
          "/research-reviews/facebook-group-membership-student-political-participation",
    "/research-reviews/influence-of-political-socialization-agents-on-pakistani-youths-political-participation-the-mediating-role-of-media-and-interpersonal-communication":
          "/research-reviews/political-socialization-youth-participation-pakistan",
    "/research-reviews/major-structural-issues-and-measures-to-improve-political-participation-of-minorities-in-india":
          "/research-reviews/political-participation-minorities-india",
    "/research-reviews/media-use-and-online-political-participation-the-mediating-roles-of-media-credibility-and-political-trust-in-jakarta-and-islamabad":
          "/research-reviews/media-use-political-participation-jakarta-islamabad",
    "/research-reviews/patterns-of-socio-political-participation-in-nepal-and-implications-for-social-inclusion":
          "/research-reviews/socio-political-participation-nepal-social-inclusion",
    "/publications/parliamentary-committees-and-opposition-effectiveness-in-pakistan-the-pakistan-peoples-party-in-the-national-assembly-19":
          "/publications/parliamentary-committees-ppp-national-assembly-1990-2018",
    "/opinion-blogs/انتخابی-دیانت-داری-ہی-پاکستان-کے-جمہور":
          "/opinion-blogs/electoral-integrity-pakistans-democratic-future",
};

function wantsMarkdown(req) {
  return /text\/markdown/i.test(req.get("accept") || "");
}

function markdownRequestPath(requestPath) {
  if (requestPath === "/index.md") return "/";
  if (requestPath.endsWith("/index.md")) return requestPath.slice(0, -"/index.md".length) || "/";
  if (requestPath.endsWith(".md")) return requestPath.slice(0, -3) || "/";
  return "";
}

function agentLinkHeader(pagePath) {
  const page = pagePath && pagePath !== "/" ? pagePath : "/";
  return `</llms.txt>; rel="describedby"; type="text/markdown", <${page}>; rel="alternate"; type="text/markdown"`;
}

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

    app.use((req, res, next) => {
          if (req.method !== "GET" && req.method !== "HEAD") return next();
          let decoded = req.originalUrl.split("?")[0];
          try {
                  decoded = decodeURIComponent(decoded);
          } catch {
                  decoded = req.originalUrl.split("?")[0];
          }
          const target = LEGACY_SLUG_REDIRECTS[decoded];
          if (target) return res.redirect(301, target);
          return next();
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

  app.get("/api/health", (_req, res) => {
    if (!databaseReady()) return res.status(503).json({ ok: false });
    res.json({ ok: true });
  });
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

  app.get("/llms.txt", (_req, res) => {
    sendText(res, "text/plain", llmsTxt());
  });

  app.get("/.well-known/mcp/server-card.json", (_req, res) => {
    sendText(res, "application/json", JSON.stringify(mcpServerCard()));
  });

  app.post("/mcp", async (req, res, next) => {
    try {
      await handleMcp(req, res);
    } catch (error) {
      next(error);
    }
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
    let templateCache = { mtime: 0, html: "" };
    function readTemplate() {
      const mtime = fs.statSync(clientIndex).mtimeMs;
      if (mtime !== templateCache.mtime) {
        templateCache = { mtime, html: fs.readFileSync(clientIndex, "utf8") };
      }
      return templateCache.html;
    }
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
          return;
        }
        if (filePath.split(path.sep).includes("media") || filePath.endsWith(".svg") || filePath.endsWith(".pdf")) {
          res.setHeader("Cache-Control", "public, max-age=604800");
        }
      },
    }));
    app.get("*", async (req, res, next) => {
      try {
        if (req.path === "/api" || req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found." });
        if (req.path.includes("\0") || req.path.includes("..")) return res.status(404).end();
        const markdownPath = markdownRequestPath(req.path);
        const pagePath = markdownPath || req.path;
        if (!markdownPath && req.path.length > 1 && req.path.endsWith("/") && !path.extname(req.path)) {
          return res.redirect(301, req.path.replace(/\/+$/, "") || "/");
        }
        if (!markdownPath && path.extname(req.path)) return res.status(404).end();
        const template = readTemplate();
        const document = await resolveDocument(pagePath);
        if (document.robotsHeader) res.setHeader("X-Robots-Tag", document.robotsHeader);
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Vary", "Accept");
        res.setHeader("Link", agentLinkHeader(pagePath));
        if (markdownPath || wantsMarkdown(req)) {
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          return res.status(document.status).send(documentMarkdown(document));
        }
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
