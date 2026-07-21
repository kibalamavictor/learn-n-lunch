(function () {
  const CMS = window.CMS || window.netlifyCMS || window.DecapCMS;
  const h = window.h;
  if (!CMS || !h) return;

  CMS.registerPreviewStyle("/dist/style.css");
  CMS.registerPreviewStyle("/admin/preview.css");

  const normalizeTag = (tag) => {
    if (typeof tag === "string") return tag;
    if (tag && typeof tag.tag === "string") return tag.tag;
    return "";
  };

  const PagePreview = ({ entry }) => {
    const data = entry.getIn(["data"]).toJS();
    const hero = data.hero || {};
    const heading = hero.heading || data.heading || data.title || "Page Preview";
    const body = hero.body || data.intro || data.description || "";

    return h(
      "div",
      { className: "preview-hero" },
      h("h1", null, heading),
      body ? h("p", null, body) : null
    );
  };

  const BlogPreview = ({ entry, widgetFor }) => {
    const data = entry.getIn(["data"]).toJS();
    const tags = (data.tags || []).map(normalizeTag).filter(Boolean);

    return h(
      "div",
      { className: "preview-blog" },
      h("h1", null, data.title || "Blog Post"),
      data.excerpt ? h("p", null, data.excerpt) : null,
      tags.length
        ? h(
            "div",
            null,
            tags.map((tag) => h("span", { className: "preview-tag", key: tag }, tag))
          )
        : null,
      widgetFor ? h("div", { className: "preview-blog-body" }, widgetFor("body")) : null
    );
  };

  CMS.registerPreviewTemplate("pages", PagePreview);
  CMS.registerPreviewTemplate("blog", BlogPreview);
})();
