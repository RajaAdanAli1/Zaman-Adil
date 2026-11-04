import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "client", "dist");
const password = "verify-password-not-default";
const replacement = "verify-password-changed";
const jwt = "verify-secret-not-for-production-use-32";
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${name}`);
    return;
  }
  failures.push(name);
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
}

function childEnv(extra) {
  return {
    PATH: process.env.PATH || "",
    PATHEXT: process.env.PATHEXT || "",
    SystemRoot: process.env.SystemRoot || "",
    TEMP: process.env.TEMP || "",
    TMP: process.env.TMP || "",
    USERPROFILE: process.env.USERPROFILE || "",
    APPDATA: process.env.APPDATA || "",
    LOCALAPPDATA: process.env.LOCALAPPDATA || "",
    NODE_ENV: "production",
    ...extra,
  };
}

function runUntilExit(env, timeout = 20000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["server.js"], {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let out = "";
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { out += chunk; });
    const timer = setTimeout(() => {
      child.kill();
      resolve({ code: null, out, timedOut: true });
    }, timeout);
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, out, timedOut: false });
    });
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function cookieHeader(response) {
  return (response.headers.getSetCookie?.() || [])
    .map((item) => item.split(";")[0])
    .join("; ");
}

async function waitForHealth(base, child) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < 30000) {
    if (child.exitCode != null) throw new Error(`Server exited ${child.exitCode}: ${last}`);
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error?.message || "not ready";
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Server did not become ready: ${last}`);
}

function scanDist() {
  const banned = ["AdilZaman-Admin-2026", "zamanadil-dev-secret", "mongodb+srv://", "mongodb://", "JWT_SECRET", "MONGO_URI"];
  const found = [];
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|js|css|json)$/i.test(entry.name)) files.push(full);
    }
  };
  walk(dist);
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const token of banned) {
      if (text.includes(token)) found.push(`${path.relative(root, file)} contains ${token}`);
    }
  }
  return found;
}

async function main() {
  check("frontend build exists", fs.existsSync(path.join(dist, "index.html")));
  const leaked = scanDist();
  check("frontend bundle has no secrets", leaked.length === 0, leaked.join("; "));

  process.env.NODE_ENV = "production";
  process.env.PORT = "4321";
  delete process.env.HOST;
  delete process.env.TRUST_PROXY;
  delete process.env.MONGO_URI;
  delete process.env.MONGODB_URI;
  const { listenConfig } = await import("../server/src/index.js");
  const { resolveDatabasePlan } = await import("../server/src/db.js");
  const { trustProxySetting } = await import("../server/src/security.js");
  const address = listenConfig();
  check("production bind defaults to 0.0.0.0", address.host === "0.0.0.0" && address.port === 4321);
  check("production trusts one proxy hop", trustProxySetting() === 1);
  process.env.TRUST_PROXY = "0";
  check("TRUST_PROXY=0 disables proxy trust", trustProxySetting() === false);
  delete process.env.TRUST_PROXY;
  check("production refuses a missing database", resolveDatabasePlan().action === "fail");
  process.env.MONGODB_URI = "mongodb://127.0.0.1:1/zamanadil_verify";
  check("MONGODB_URI is accepted", resolveDatabasePlan().action === "uri");
  delete process.env.MONGODB_URI;

  const noJwt = await runUntilExit(childEnv({ PORT: "4321", MONGODB_URI: "mongodb://127.0.0.1:1/zamanadil_verify" }));
  check("missing JWT_SECRET fails startup", noJwt.code === 1 && noJwt.out.includes("JWT_SECRET"), noJwt.out.slice(0, 300));

  const savedPort = process.env.PORT;
  process.env.PORT = "";
  check("blank PORT uses 3000", listenConfig().port === 3000);
  process.env.PORT = "127.0.0.1:3210";
  check("host:port value is accepted", listenConfig().port === 3210);
  let rejected = false;
  process.env.PORT = "not-a-port";
  try {
    listenConfig();
  } catch (error) {
    rejected = error.message.includes("not-a-port");
  }
  check("a non-numeric PORT is rejected", rejected);
  process.env.PORT = savedPort;

  const noPort = await runUntilExit(childEnv({ JWT_SECRET: jwt, MONGODB_URI: "mongodb://127.0.0.1:1/zamanadil_verify" }));
  check(
    "missing PORT does not crash on the port check",
    noPort.code === 1 && noPort.out.includes("PORT is not set") && !noPort.out.includes("must be an integer"),
    noPort.out.slice(0, 300),
  );

  const noDb = await runUntilExit(childEnv({ JWT_SECRET: jwt, PORT: "4321" }));
  check(
    "missing database fails without starting memory",
    noDb.code === 1 && noDb.out.includes("MONGO_URI") && !noDb.out.includes("Development MongoDB started"),
    noDb.out.slice(0, 300),
  );

  const memory = await MongoMemoryServer.create({ instance: { dbName: "zamanadil_verify" } });
  const mongoUrl = new URL(memory.getUri());
  mongoUrl.pathname = "/zamanadil_verify";
  const mongoUri = mongoUrl.toString();
  let child;
  let output = "";
  try {
    const refused = await runUntilExit(childEnv({
      PORT: String(await freePort()),
      HOST: "127.0.0.1",
      JWT_SECRET: jwt,
      MONGODB_URI: mongoUri,
      ADMIN_PASSWORD: "AdilZaman-Admin-2026",
      TRUST_PROXY: "0",
    }), 30000);
    check(
      "built-in admin password is refused",
      refused.code === 1 && refused.out.includes("ADMIN_PASSWORD") && !refused.out.includes("AdilZaman-Admin-2026"),
      refused.out.slice(0, 400),
    );

    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ["server.js"], {
      cwd: root,
      env: childEnv({
        PORT: String(port),
        HOST: "127.0.0.1",
        JWT_SECRET: jwt,
        MONGODB_URI: mongoUri,
        ADMIN_USERNAME: "verify-admin",
        ADMIN_PASSWORD: password,
        IP_HASH_SALT: "verify-salt",
        TRUST_PROXY: "0",
      }),
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    await waitForHealth(base, child);
    check("startup log hides the database URI and password", output.includes("MongoDB connected (zamanadil_verify)") && output.includes(`Listening on 127.0.0.1:${port}`) && !output.includes(password) && !output.includes(mongoUri));

    const health = await fetch(`${base}/api/health`);
    check("health endpoint", health.status === 200 && (await health.json()).ok === true);
    check("API responses are not stored", health.headers.get("cache-control") === "no-store");

    const home = await fetch(`${base}/`);
    const homeHtml = await home.text();
    check("homepage", home.status === 200 && homeHtml.includes('id="root"') && !homeHtml.includes("/src/main.jsx"));
    check("security headers", ["nosniff", "DENY", "max-age=31536000"].every((token) => [...home.headers].some(([, value]) => value.includes(token))) && (home.headers.get("content-security-policy") || "").includes("default-src 'self'"));

    const assetPath = homeHtml.match(/\/assets\/[^"']+\.js/)?.[0];
    const asset = assetPath ? await fetch(`${base}${assetPath}`) : null;
    check("built JavaScript asset", Boolean(asset && asset.ok && (asset.headers.get("content-type") || "").includes("javascript")));
    check("hashed assets are cached immutably", asset?.headers.get("cache-control")?.includes("immutable") === true);

    const logo = await fetch(`${base}/media/logo.png`);
    check("public image", logo.status === 200 && (logo.headers.get("content-type") || "").includes("image"));

    const about = await fetch(`${base}/about`);
    check("direct React route", about.status === 200 && (await about.text()).includes('id="root"'));
    const refreshed = await fetch(`${base}/publications`);
    check("publication route refresh", refreshed.status === 200 && (refreshed.headers.get("content-type") || "").includes("html"));
    const missingPage = await fetch(`${base}/this-page-is-not-real`);
    const missingHtml = await missingPage.text();
    check("unknown frontend route returns the app shell", missingPage.status === 404 && missingHtml.includes('id="root"') && !missingHtml.trim().startsWith("{"));

    const slash = await fetch(`${base}/about/`, { redirect: "manual" });
    check("trailing slash redirect", slash.status === 301 && slash.headers.get("location") === "/about");

    const api = await fetch(`${base}/api/home`);
    const apiBody = await api.json();
    check("publications API", api.status === 200 && Array.isArray(apiBody.featured));
    const missingApi = await fetch(`${base}/api/does-not-exist`);
    const missingApiBody = await missingApi.json();
    check("unknown API route returns JSON", missingApi.status === 404 && missingApiBody.error === "Not found." && (missingApi.headers.get("content-type") || "").includes("json"));

    const source = await fetch(`${base}/server/src/seed.js`);
    const sourceBody = await source.text();
    check("server source is not served", source.status === 404 && !sourceBody.includes(password) && !sourceBody.includes("AdilZaman-Admin-2026"));

    const stats = await fetch(`${base}/api/admin/stats`);
    check("admin stats require a session", stats.status === 401 && (await stats.json()).error === "Sign in required.");
    const messages = await fetch(`${base}/api/admin/messages`);
    check("admin messages require a session", messages.status === 401);

    const injected = await fetch(`${base}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ username: { $gt: "" }, password: "x" }),
    });
    check("login rejects a non-text username", injected.status === 400);

    const evil = await fetch(`${base}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site" },
      body: JSON.stringify({ name: "A", email: "a@example.com", subject: "S", message: "M", enquiry: "Other", consent: true }),
    });
    check("cross-site write is rejected", evil.status === 403);
    const cors = await fetch(`${base}/api/health`, { headers: { Origin: "https://evil.example" } });
    check("untrusted origins are not reflected", cors.headers.get("access-control-allow-origin") !== "https://evil.example");
    const same = await fetch(`${base}/api/health`, { headers: { Origin: base } });
    check("same-origin requests are allowed", same.headers.get("access-control-allow-origin") === base);

    const login = await fetch(`${base}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ username: "verify-admin", password }),
    });
    const loginCookie = (login.headers.getSetCookie?.() || []).join(";");
    check("login sets a hardened cookie", login.status === 200 && /za_session=/.test(loginCookie) && /httponly/i.test(loginCookie) && /secure/i.test(loginCookie) && /samesite=lax/i.test(loginCookie));
    const session = cookieHeader(login);
    const blocked = await fetch(`${base}/api/admin/publications`, { headers: { Cookie: session } });
    check("desk stays closed until the password changes", blocked.status === 403);

    const changed = await fetch(`${base}/api/admin/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base, Cookie: session },
      body: JSON.stringify({ password: replacement }),
    });
    check("password change", changed.status === 200);
    const renewed = cookieHeader(changed);
    const opened = await fetch(`${base}/api/admin/stats`, { headers: { Cookie: renewed } });
    check("desk opens after the password change", opened.status === 200);
    const stale = await fetch(`${base}/api/admin/stats`, { headers: { Cookie: session } });
    check("previous session is revoked", stale.status === 401);

    child.send("shutdown");
    const exitCode = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 8000);
      child.once("close", (code) => {
        clearTimeout(timer);
        resolve(code);
      });
    });
    check(
      "graceful shutdown",
      exitCode === 0 && output.includes("Shutting down (IPC)"),
      `code=${exitCode} tail=${output.slice(-300)}`,
    );
  } finally {
    if (child && child.exitCode == null) child.kill();
    await memory.stop();
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll production checks passed.");
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
