import { Article, Publication } from "./models.js";
import { ORIGIN, PROFILE } from "../../shared/seo.js";

const searchTool = {
  name: "search_zamanadil",
  title: "Search zamanadil.com",
  description: "Search Dr. Adil Zaman's publications, research reviews, opinion and site pages.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Words to search for" },
    },
    required: ["query"],
  },
};

export function mcpServerCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: {
      name: "zamanadil",
      title: "Dr. Adil Zaman",
      version: "1.0.0",
    },
    description: `${PROFILE.description} Public read-only search. Contact enquiries are not available to agents.`,
    transport: {
      type: "streamable-http",
      endpoint: `${ORIGIN}/mcp`,
    },
    authentication: { required: false },
    capabilities: { tools: { listChanged: false } },
    tools: [searchTool],
  };
}

async function searchSite(query) {
  const q = String(query || "").trim().replace(/\u0000/g, "").slice(0, 120);
  if (q.length < 2) return { query: q, results: [] };
  const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const [publications, articles] = await Promise.all([
    Publication.find({
      $or: [{ title: pattern }, { authors: pattern }, { venue: pattern }, { summary: pattern }],
    }).limit(8).lean(),
    Article.find({
      published: true,
      $or: [{ title: pattern }, { category: pattern }, { paragraphs: pattern }],
    }).limit(8).lean(),
  ]);
  return {
    query: q,
    results: [
      ...publications.map((item) => ({
        type: "Publication",
        title: item.title,
        url: `${ORIGIN}/publications/${item.slug}`,
        summary: `${item.year} · ${item.venue}`,
      })),
      ...articles.map((item) => ({
        type: item.kind === "review" ? "Research Review" : "Opinion",
        title: item.title,
        url: `${ORIGIN}${item.kind === "review" ? "/research-reviews" : "/opinion-blogs"}/${item.slug}`,
        summary: item.category || "",
      })),
    ],
  };
}

export async function handleMcp(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const id = Object.prototype.hasOwnProperty.call(body, "id") ? body.id : null;
  const method = body.method;
  const result = (value) => res.json({ jsonrpc: "2.0", id, result: value });
  const fail = (code, message) => res.status(400).json({ jsonrpc: "2.0", id, error: { code, message } });

  if (method === "notifications/initialized") return res.status(202).end();
  if (method === "initialize") {
    return result({
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "zamanadil", version: "1.0.0" },
    });
  }
  if (method === "tools/list") return result({ tools: [searchTool] });
  if (method === "tools/call") {
    if (body.params?.name !== searchTool.name) return fail(-32602, "Unknown tool.");
    const found = await searchSite(body.params?.arguments?.query);
    return result({
      content: [{ type: "text", text: JSON.stringify(found) }],
      structuredContent: found,
    });
  }
  return fail(-32601, "Method not found.");
}
