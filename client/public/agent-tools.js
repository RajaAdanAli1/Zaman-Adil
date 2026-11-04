(function () {
  var tool = {
    name: "search_zamanadil",
    description: "Search publications, research reviews, opinion and pages on zamanadil.com.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to search for" },
      },
      required: ["query"],
    },
    execute: function (input) {
      var query = String((input && input.query) || "").trim();
      return fetch("/api/search?q=" + encodeURIComponent(query), {
        headers: { Accept: "application/json" },
      }).then(function (response) {
        return response.ok ? response.json() : { error: "Search failed." };
      });
    },
  };
  [navigator.modelContext, document.modelContext].forEach(function (target) {
    if (target && typeof target.registerTool === "function") target.registerTool(tool);
  });
})();
