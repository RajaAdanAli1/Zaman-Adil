import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { assertRuntimeConfig } from "./auth.js";
import { connectDatabase, disconnectDatabase, markDatabaseReady } from "./db.js";
import { clientBuildIsCurrent, writeClientStamp } from "../../scripts/client-stamp.mjs";
import { clientIndex, repoRoot } from "./paths.js";
import { publicError } from "./redact.js";
import { seedIfEmpty } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

export function parseListenPort(value) {
  const raw = String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!raw) return { port: null };
  const match = /^(?:(?:https?:\/\/)?(?:\[[^\]]+\]|[^:/\s]+):)?(\d{1,5})$/.exec(raw);
  const port = match ? Number(match[1]) : NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { port: null, invalid: raw.slice(0, 80) };
  return { port };
}

export function listenConfig() {
  const host = (process.env.HOST ?? "").trim() || "0.0.0.0";
  const parsed = parseListenPort(process.env.PORT);
  if (parsed.invalid) {
    throw new Error(`PORT must be an integer from 1 to 65535, or a host:port value. Received ${JSON.stringify(parsed.invalid)}.`);
  }
  if (parsed.port) return { port: parsed.port, host };
  if (process.env.NODE_ENV === "production") {
    console.log("PORT is not set. Listening on 3000.");
    return { port: 3000, host };
  }
  return { port: 5000, host };
}

function viteBinary() {
  const candidates = [
    path.join(repoRoot, "node_modules", "vite", "bin", "vite.js"),
    path.join(repoRoot, "client", "node_modules", "vite", "bin", "vite.js"),
  ];
  return candidates.find((file) => fs.existsSync(file)) || "";
}

export function ensureClientBuild() {
  if (process.env.NODE_ENV !== "production" || clientBuildIsCurrent()) return;
  const [major, minor] = process.versions.node.split(".").map(Number);
  const nodeOk = major > 22 || (major === 22 && minor >= 12) || (major === 20 && minor >= 19);
  const notice = fs.existsSync(clientIndex) ? "Frontend build does not match the client source." : "Frontend build is missing.";
  console.log(`${notice} Node ${process.version} on ${process.platform}/${process.arch}.`);
  if (!nodeOk) {
    throw new Error(`Hostinger must use Node.js 22.12 or newer. This process is Node ${process.version}.`);
  }
  const viteBin = viteBinary();
  if (!viteBin) {
    throw new Error("Vite is not installed in node_modules, so the frontend cannot be built on the server.");
  }
  const result = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: path.join(repoRoot, "client"),
    encoding: "utf8",
    env: process.env,
    maxBuffer: 1024 * 1024,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  if (output) console.log(output.slice(-2000));
  if (result.error || result.status !== 0 || !fs.existsSync(clientIndex)) {
    const reason = result.error?.message || (result.signal ? `signal ${result.signal}` : `exit ${result.status}`);
    throw new Error(`Frontend build failed (${reason}). ${output}`.replace(/\s+/g, " ").slice(0, 350));
  }
  writeClientStamp();
}

export function assertProductionBuild() {
  if (process.env.NODE_ENV !== "production") return;
  if (!fs.existsSync(clientIndex)) {
    throw new Error("The production frontend build is missing (client/dist/index.html).");
  }
}

function listen(app, port, host) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const server = app.listen(port, host, () => {
      settled = true;
      resolve(server);
    });
    server.on("error", (error) => {
      if (settled) {
        console.error(publicError(error));
        process.exit(1);
        return;
      }
      settled = true;
      reject(error);
    });
  });
}

function bindShutdown(server) {
  let closing = false;
  async function shutdown(signal) {
    if (closing) return;
    closing = true;
    console.log(`Shutting down (${signal})`);
    const timer = setTimeout(() => {
      server.closeAllConnections?.();
      console.error("Shutdown timed out.");
      process.exit(1);
    }, 10000);
    timer.unref();
    server.closeIdleConnections?.();
    await new Promise((resolve) => server.close(resolve));
    try {
      await disconnectDatabase();
    } catch (error) {
      console.error(publicError(error));
    }
    clearTimeout(timer);
    process.exit(0);
  }
  const trigger = (signal) => {
    shutdown(signal).catch((error) => {
      console.error(publicError(error));
      process.exit(1);
    });
  };
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => trigger(signal));
  if (process.channel) {
    process.once("message", (message) => {
      if (message === "shutdown") trigger("IPC");
    });
  }
}

export async function start() {
  assertRuntimeConfig();
  const { port, host } = listenConfig();
  ensureClientBuild();
  assertProductionBuild();
  const app = createApp();
  const server = await listen(app, port, host);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  console.log(`Listening on ${host}:${port}`);
  bindShutdown(server);
  try {
    await connectDatabase();
    await seedIfEmpty();
    markDatabaseReady();
  } catch (error) {
    await disconnectDatabase().catch(() => {});
    server.close();
    throw error;
  }
  return server;
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entry) {
  start().catch((error) => {
    console.error(publicError(error));
    process.exit(1);
  });
}
