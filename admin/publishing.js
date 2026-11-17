/** Keep the site's visibility flag in sync with Decap's single Publish action. */
(function () {
  const CMS = window.CMS;
  if (!CMS) return;

  CMS.registerEventListener({
    name: "preSave",
    handler: ({ entry }) => {
      const data = entry.get("data");
      const collection = entry.get("collection");
      if (collection !== "blog" && collection !== "reports") return data;

      // Generate only when blank so edits never silently change a published URL.
      let prepared = data;
      if (collection === "blog" && !String(data.get("slug") || "").trim()) {
        const slug = String(data.get("title") || "")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[’']/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (!slug) throw new Error("Please enter a URL slug using letters or numbers.");
        prepared = prepared.set("slug", slug);
      }

      // Hidden defaults only apply to new entries; also handle existing drafts.
      let published = prepared.set("status", "published");
      if (!published.get("publishedAt")) {
        published = published.set("publishedAt", new Date().toISOString());
      }
      return published;
    }
  });
})();
