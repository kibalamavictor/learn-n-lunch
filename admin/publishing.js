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

      // Hidden defaults only apply to new entries; also handle existing drafts.
      let published = data.set("status", "published");
      if (!published.get("publishedAt")) {
        published = published.set("publishedAt", new Date().toISOString());
      }
      return published;
    }
  });
})();
