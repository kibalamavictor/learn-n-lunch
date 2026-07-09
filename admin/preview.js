(function () {
  const CMS = window.CMS || window.netlifyCMS || window.DecapCMS;
  if (!CMS) return;

  CMS.registerPreviewStyle("/dist/style.css");
  CMS.registerPreviewStyle("/admin/preview.css");

  const PagePreview = ({ entry }) => {
    const data = entry.getIn(["data"]).toJS();
    const hero = data.hero || {};
    const heading = hero.heading || data.heading || data.title || "Page Preview";
    const body = hero.body || data.intro || data.description || "";

    return CMS.createElement(
      "div",
      { className: "preview-hero" },
      CMS.createElement("h1", null, heading),
      body ? CMS.createElement("p", null, body) : null
    );
  };

  const BlogPreview = ({ entry }) => {
    const data = entry.getIn(["data"]).toJS();
    const tags = data.tags || [];

    return CMS.createElement(
      "div",
      { className: "preview-blog" },
      CMS.createElement("h1", null, data.title || "Blog Post"),
      data.excerpt ? CMS.createElement("p", null, data.excerpt) : null,
      CMS.createElement(
        "div",
        null,
        tags.map((tag) => CMS.createElement("span", { className: "preview-tag", key: tag }, tag))
      )
    );
  };

  CMS.registerPreviewTemplate("pages", PagePreview);
  CMS.registerPreviewTemplate("blog", BlogPreview);
})();
