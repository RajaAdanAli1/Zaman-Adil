const searchTool = {
  name: "search_zamanadil",
  description: "Search publications, research reviews, opinion and pages on zamanadil.com.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Words to search for" },
    },
    required: ["query"],
  },
  async execute(input) {
    const query = String(input?.query || "").trim();
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { error: "Search failed." };
    return response.json();
  },
};

export function registerAgentTools() {
  const targets = [globalThis.navigator?.modelContext, globalThis.document?.modelContext];
  for (const target of targets) {
    if (target && typeof target.registerTool === "function") target.registerTool(searchTool);
  }
}
