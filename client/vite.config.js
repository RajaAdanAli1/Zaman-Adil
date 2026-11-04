import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: { allow: [root] },
    proxy: {
      "/api": "http://localhost:5000",
      "/robots.txt": "http://localhost:5000",
      "/sitemap.xml": "http://localhost:5000",
      "/sitemap-pages.xml": "http://localhost:5000",
      "/sitemap-publications.xml": "http://localhost:5000",
      "/sitemap-writing.xml": "http://localhost:5000",
      "/llms.txt": "http://localhost:5000",
      "/mcp": "http://localhost:5000",
      "/.well-known": "http://localhost:5000",
    },
  },
});
