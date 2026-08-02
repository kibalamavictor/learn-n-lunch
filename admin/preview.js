(function () {
  const CMS = window.CMS || window.netlifyCMS || window.DecapCMS;
  const h = window.h;
  if (!CMS || !h) return;

  CMS.registerPreviewStyle("/admin/preview.css");

  const normalizeTag = (tag) => {
    if (typeof tag === "string") return tag;
    if (tag && typeof tag.tag === "string") return tag.tag;
    return "";
  };

  const tagClass = (tag) => {
    const slug = String(tag || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-");
    if (slug.includes("event")) return "preview-tag is-events";
    if (slug.includes("report")) return "preview-tag is-reports";
    if (slug.includes("donor")) return "preview-tag is-donors";
    return "preview-tag";
  };

  const PagePreview = ({ entry }) => {
    const data = entry.getIn(["data"]).toJS();
    const hero = data.hero || {};
    const heading = hero.heading || data.heading || data.title || "Page Preview";
    const body = hero.body || hero.subtitle || hero.description || data.intro || data.description || "";

    return h(
      "div",
      { className: "preview-frame preview-hero" },
      h("div", { className: "preview-kicker" }, "Website page preview"),
      h("h1", null, heading),
      body ? h("p", null, body) : h("p", { className: "preview-empty" }, "Add hero text to see it here.")
    );
  };

  const BlogPreview = ({ entry, widgetFor }) => {
    const data = entry.getIn(["data"]).toJS();
    const tags = (data.tags || []).map(normalizeTag).filter(Boolean);
    const cover = data.coverImage;

    return h(
      "div",
      { className: "preview-frame preview-blog" },
      h("div", { className: "preview-kicker" }, "Story preview"),
      cover
        ? h("img", {
            className: "preview-cover",
            src: cover,
            alt: data.coverImageAlt || data.title || ""
          })
        : null,
      h("h1", null, data.title || "Untitled story"),
      data.excerpt ? h("p", null, data.excerpt) : null,
      tags.length
        ? h(
            "div",
            { className: "preview-meta" },
            tags.map((tag) => h("span", { className: tagClass(tag), key: tag }, tag))
          )
        : null,
      widgetFor
        ? h("div", { className: "preview-blog-body" }, widgetFor("body"))
        : h("p", { className: "preview-empty" }, "Write the story body to preview it here.")
    );
  };

  CMS.registerPreviewTemplate("pages", PagePreview);
  CMS.registerPreviewTemplate("blog", BlogPreview);
  CMS.registerPreviewTemplate("reports", BlogPreview);
})();
