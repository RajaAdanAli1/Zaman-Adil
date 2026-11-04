import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(here, "..", "..");
export const clientDist = path.join(repoRoot, "client", "dist");
export const clientIndex = path.join(clientDist, "index.html");
