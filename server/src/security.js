import crypto from "node:crypto";

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
];

let salt = process.env.IP_HASH_SALT?.trim() || "";

export function addressSalt() {
  if (!salt) salt = crypto.randomBytes(16).toString("hex");
  return salt;
}

export function clientAddress(req) {
  return req.ip || req.socket?.remoteAddress || "local";
}

export function hashAddress(ip) {
  return crypto.createHash("sha256").update(`${addressSalt()}|${ip}`).digest("hex").slice(0, 24);
}

export function configuredOrigins() {
  const configured = (process.env.CLIENT_ORIGIN || "").trim();
  const fromEnv = !configured || configured === "*"
    ? []
    : configured.split(",").map((item) => item.trim()).filter(Boolean);
  if (process.env.NODE_ENV === "production") return fromEnv;
  return [...new Set([...fromEnv, ...DEV_ORIGINS])];
}

export function originAllowed(origin, req) {
  if (!origin) return true;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;
  if (configuredOrigins().includes(origin)) return true;
  const host = req.get("host");
  return Boolean(host && url.host === host);
}

export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "img-src 'self' https: data:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "script-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; ")
    );
  }
  next();
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function csrfProtection(req, res, next) {
  if (!UNSAFE.has(req.method) || !req.path.startsWith("/api")) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  if (originAllowed(origin, req)) return next();
  return res.status(403).json({ error: "This request was rejected." });
}
