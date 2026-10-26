import dotenv from "dotenv";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { assertRuntimeConfig } from "./auth.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { seedIfEmpty } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

export async function start() {
  assertRuntimeConfig();
  await connectDatabase();
  await seedIfEmpty();
  const app = createApp();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  async function shutdown() {
    server.close();
    await disconnectDatabase();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  return server;
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entry) {
  start().catch((error) => {
    console.error(error?.message || "The server could not start.");
    process.exit(1);
  });
}
