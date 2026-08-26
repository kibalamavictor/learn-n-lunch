/**
 * Learn N' Lunch — Decap CMS live previews
 * File collections register by FILE name (home, impact, …), not collection name.
 */
(function () {
  const CMS = window.CMS || window.DecapCms || window.netlifyCMS;
  const h = window.h;
  if (!CMS || !h) {
    console.warn("[LnL CMS] Preview unavailable: CMS or h() missing.");
    return;
  }

  CMS.registerPreviewStyle("/admin/preview.css");
  CMS.registerPreviewStyle(
    "https://fonts.googleapis.com/css2?family=Anton&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap"
  );

  /* ——— helpers ——— */
  const dataOf = (entry) => {
    try {
      return entry.getIn(["data"]).toJS() || {};
    } catch (e) {
      return {};
    }
  };

  const text = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback || "";
    return String(value);
  };

  const listItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        return item.point || item.step || item.chunk || item.label || item.title || item.name || "";
      })
      .filter(Boolean);
  };

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
    if (slug.includes("student")) return "preview-tag is-students";
    return "preview-tag";
  };

  const assetUrl = (getAsset, path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
      return path;
    }
    try {
      if (typeof getAsset === "function") {
        const asset = getAsset(path);
        if (asset && typeof asset.toString === "function") return asset.toString();
        if (typeof asset === "string") return asset;
      }
    } catch (e) {
      /* fall through */
    }
    return path.startsWith("/") ? path : `/${path}`;
  };

  const section = (title, children) =>
    h(
      "section",
      { className: "preview-section" },
      title ? h("h2", { className: "preview-section-title" }, title) : null,
      children
    );

  const empty = (msg) => h("p", { className: "preview-empty" }, msg);

  const img = (src, alt, className) =>
    src
      ? h("img", {
          className: className || "preview-img",
          src,
          alt: alt || ""
        })
      : null;

  const bullets = (items) => {
    const list = listItems(items);
    if (!list.length) return null;
    return h(
      "ul",
      { className: "preview-list" },
      list.map((item, i) => h("li", { key: i }, item))
    );
  };

  const kicker = (label) => h("div", { className: "preview-kicker" }, label);

  const metaRow = (pairs) =>
    h(
      "div",
      { className: "preview-meta-row" },
      pairs
        .filter((p) => p && p.value)
        .map((p, i) =>
          h("div", { className: "preview-meta-item", key: i }, [
            h("span", { className: "preview-meta-label" }, p.label),
            h("span", { className: "preview-meta-value" }, p.value)
          ])
        )
    );

  /* ——— Story / Report ——— */
  const BlogPreview = ({ entry, widgetFor, getAsset }) => {
    const data = dataOf(entry);
    const tags = (data.tags || []).map(normalizeTag).filter(Boolean);
    const cover = assetUrl(getAsset, data.coverImage);
    const status = text(data.status, "draft");

    return h("div", { className: "preview-frame preview-blog" }, [
      kicker(data.reportPdf ? "Report preview · live" : "Story preview · live"),
      h(
        "div",
        { className: `preview-status is-${status}` },
        status === "published" ? "Published" : "Draft"
      ),
      cover ? img(cover, data.coverImageAlt || data.title, "preview-cover") : null,
      h("h1", { className: "preview-title" }, text(data.title, "Untitled story")),
      data.excerpt ? h("p", { className: "preview-lead" }, data.excerpt) : null,
      metaRow([
        { label: "Author", value: data.author },
        { label: "Slug", value: data.slug ? `/stories/${data.slug}/` : "" },
        { label: "Published", value: data.publishedAt ? String(data.publishedAt).slice(0, 10) : "" }
      ]),
      tags.length
        ? h(
            "div",
            { className: "preview-meta" },
            tags.map((tag) => h("span", { className: tagClass(tag), key: tag }, tag))
          )
        : null,
      data.reportPdf
        ? h("p", { className: "preview-pdf-note" }, `PDF: ${data.reportPdf}`)
        : null,
      widgetFor
        ? h("div", { className: "preview-blog-body" }, widgetFor("body"))
        : empty("Write the story body to preview it here.")
    ]);
  };

  /* ——— Home ——— */
  const HomePreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    const hero = data.hero || {};
    const intro = data.impactIntro || {};
    const how = data.howItWorks || {};
    const moments = data.moments || {};
    const stories = data.storiesTeaser || {};
    const partners = data.partners || {};
    const partnerItems = Array.isArray(partners.items) ? partners.items : [];
    const footer = data.footerCta || {};
    const cards = Array.isArray(data.modelWorkCards) ? data.modelWorkCards : [];
    const carousel = Array.isArray(hero.carouselImages) ? hero.carouselImages : [];

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Home · live preview"),
      section("Hero", [
        h("h1", { className: "preview-title" }, text(hero.heading, "Hero heading")),
        hero.body ? h("p", { className: "preview-lead" }, hero.body) : empty("Add hero body text."),
        carousel.length
          ? h(
              "div",
              { className: "preview-thumbs" },
              carousel.map((item, i) =>
                img(assetUrl(getAsset, item.image), item.alt || `Slide ${i + 1}`, "preview-thumb")
              )
            )
          : null
      ]),
      data.missionBanner && listItems(data.missionBanner).length
        ? section(
            "Mission banner",
            h("p", { className: "preview-banner" }, listItems(data.missionBanner).join(" · "))
          )
        : null,
      section("Impact intro", [
        intro.body ? h("p", null, intro.body) : empty("Add impact intro body."),
        intro.ctaLabel ? h("span", { className: "preview-btn" }, intro.ctaLabel) : null,
        h("div", { className: "preview-thumbs" }, [
          img(assetUrl(getAsset, intro.leftImage), intro.leftImageAlt, "preview-thumb"),
          img(assetUrl(getAsset, intro.rightImage), intro.rightImageAlt, "preview-thumb")
        ])
      ]),
      cards.length
        ? section(
            "How our model works",
            h(
              "div",
              { className: "preview-cards" },
              cards.map((card, i) =>
                h(
                  "article",
                  {
                    className: "preview-card",
                    key: i,
                    style: { borderTop: `6px solid ${card.accentColor || "#d3eeff"}` }
                  },
                  [
                    h("h3", null, text(card.heading, "Card")),
                    card.body ? h("p", null, card.body) : null
                  ]
                )
              )
            )
          )
        : null,
      section("How it works", [
        h(
          "h3",
          { className: "preview-subtitle" },
          [how.titleLine1, how.titleLine2].filter(Boolean).join(" ") || "How it works title"
        ),
        how.studentsFlow
          ? h("div", { className: "preview-flow" }, [
              h("strong", null, text(how.studentsFlow.label, "Students")),
              bullets(how.studentsFlow.steps),
              how.studentsFlow.ctaLabel
                ? h("span", { className: "preview-btn" }, how.studentsFlow.ctaLabel)
                : null
            ])
          : null,
        how.donorsFlow
          ? h("div", { className: "preview-flow" }, [
              h("strong", null, text(how.donorsFlow.label, "Donors")),
              bullets(how.donorsFlow.steps),
              how.donorsFlow.ctaLabel
                ? h("span", { className: "preview-btn" }, how.donorsFlow.ctaLabel)
                : null
            ])
          : null
      ]),
      section("Moments", [
        h("h3", { className: "preview-subtitle" }, text(moments.heading, "Moments")),
        moments.statementQuote
          ? h("blockquote", { className: "preview-quote" }, moments.statementQuote)
          : null,
        Array.isArray(moments.photos) && moments.photos.length
          ? h(
              "div",
              { className: "preview-thumbs" },
              moments.photos.map((p, i) =>
                img(assetUrl(getAsset, p.image), p.alt || `Photo ${i + 1}`, "preview-thumb")
              )
            )
          : null
      ]),
      section("Stories teaser", [
        h("h3", { className: "preview-subtitle" }, text(stories.heading, "Stories")),
        stories.description ? h("p", null, stories.description) : null,
        stories.moreLabel ? h("span", { className: "preview-btn" }, stories.moreLabel) : null
      ]),
      section("Our partners", [
        h("h3", { className: "preview-subtitle" }, text(partners.heading, "Our Partners")),
        partners.intro ? h("p", null, partners.intro) : null,
        partnerItems.length
          ? h(
              "div",
              { className: "preview-cards" },
              partnerItems.map((p, i) =>
                h("article", { className: "preview-card", key: i }, [
                  p.logo ? img(assetUrl(getAsset, p.logo), p.logoAlt || p.name, "preview-thumb") : null,
                  h("h3", null, text(p.name, "Partner")),
                  p.url ? h("p", { className: "preview-empty" }, p.url) : null
                ])
              )
            )
          : empty("Add partners to preview them.")
      ]),
      section("Footer CTA", [
        h("h3", { className: "preview-subtitle" }, text(footer.title, "Footer CTA")),
        footer.buttonLabel ? h("span", { className: "preview-btn" }, footer.buttonLabel) : null,
        img(assetUrl(getAsset, footer.backgroundImage), footer.backgroundImageAlt, "preview-cover")
      ])
    ]);
  };

  /* ——— About ——— */
  const AboutPreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    const hero = data.hero || {};
    const mv = data.missionVision || {};
    const values = Array.isArray(data.values) ? data.values : [];
    const challenge = data.challenge || {};

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("About Us · live preview"),
      section("Hero", [
        h("h1", { className: "preview-title" }, text(hero.heading, "About heading")),
        hero.body ? h("p", { className: "preview-lead" }, hero.body) : null,
        img(assetUrl(getAsset, hero.image), hero.imageAlt, "preview-cover")
      ]),
      data.standForHeading || data.standForStatement
        ? section(text(data.standForHeading, "We stand for"), [
            data.standForStatement ? h("p", null, data.standForStatement) : null
          ])
        : null,
      section("Mission & Vision", [
        mv.mission ? h("p", null, [h("strong", null, "Mission: "), mv.mission]) : null,
        mv.vision ? h("p", null, [h("strong", null, "Vision: "), mv.vision]) : null
      ]),
      values.length
        ? section(
            "Values",
            h(
              "div",
              { className: "preview-cards" },
              values.map((v, i) =>
                h("article", { className: "preview-card", key: i }, [
                  h("h3", null, text(v.name, "Value")),
                  v.description ? h("p", null, v.description) : null
                ])
              )
            )
          )
        : null,
      section("Challenge", [
        h("h3", { className: "preview-subtitle" }, text(challenge.heading, "Challenge")),
        challenge.body ? h("p", null, challenge.body) : null,
        img(assetUrl(getAsset, challenge.image), challenge.imageAlt, "preview-cover")
      ])
    ]);
  };

  /* ——— Impact ——— */
  const ImpactPreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    const hero = data.hero || {};
    const faces = data.faces || {};
    const framework = data.strategicFramework || {};
    const report = data.impactReport || {};
    const footer = data.footerCta || {};

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Impact · live preview"),
      section("Hero", [
        h("h1", { className: "preview-title" }, text(hero.heading, "OUR IMPACT")),
        hero.subtitle ? h("p", { className: "preview-lead" }, hero.subtitle) : null,
        img(assetUrl(getAsset, hero.image), hero.imageAlt, "preview-cover"),
        h("h3", { className: "preview-subtitle" }, text(hero.meaningHeading, "What impact means")),
        hero.meaningBody ? h("p", null, hero.meaningBody) : null
      ]),
      section("Numbers", h("h3", { className: "preview-subtitle" }, text(data.numbersHeading, "The Numbers"))),
      section("Faces", [
        h("h3", { className: "preview-subtitle" }, text(faces.heading || data.facesHeading, "Faces")),
        faces.ctaLabel ? h("span", { className: "preview-btn" }, faces.ctaLabel) : null
      ]),
      data.scrollBanner
        ? section("Scroll banner", h("p", { className: "preview-banner" }, data.scrollBanner))
        : null,
      section(text(framework.heading, "Strategic Framework"), [
        framework.description ? h("p", null, framework.description) : null,
        framework.file
          ? h("span", { className: "preview-btn" }, text(framework.buttonLabel, "Download Framework"))
          : empty("Upload a Strategic Framework PDF to enable download.")
      ]),
      section(text(report.heading, "Impact Report"), [
        report.description ? h("p", null, report.description) : null,
        report.file
          ? h("span", { className: "preview-btn" }, text(report.buttonLabel, "Download Report"))
          : empty("Upload an Impact Report PDF to enable download.")
      ]),
      section("Footer CTA", [
        h("h3", { className: "preview-subtitle" }, text(footer.title, "Footer CTA")),
        footer.buttonLabel ? h("span", { className: "preview-btn" }, footer.buttonLabel) : null
      ])
    ]);
  };

  /* ——— Stories listing ——— */
  const StoriesPagePreview = ({ entry }) => {
    const data = dataOf(entry);
    const hero = data.hero || {};
    const filters = Array.isArray(data.filters) ? data.filters : [];
    const featured = Array.isArray(data.featuredSections) ? data.featuredSections : [];

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Stories listing · live preview"),
      section("Hero", [
        h("h1", { className: "preview-title" }, text(hero.heading, "Stories")),
        hero.description ? h("p", { className: "preview-lead" }, hero.description) : null
      ]),
      filters.length
        ? section(
            "Filters",
            h(
              "div",
              { className: "preview-meta" },
              filters.map((f, i) =>
                h("span", { className: "preview-tag", key: i }, text(f.label, f.slug))
              )
            )
          )
        : null,
      featured.length
        ? section(
            "Featured sections",
            h(
              "div",
              { className: "preview-cards" },
              featured.map((s, i) =>
                h("article", { className: "preview-card", key: i }, [
                  h("h3", null, text(s.sectionLabel, "Section")),
                  h("p", null, `Category: ${text(s.categorySlug, "—")}`),
                  h("p", null, `Lead: ${text(s.leadPostSlug, "—")}`)
                ])
              )
            )
          )
        : null
    ]);
  };

  /* ——— Donate / Get Involved / Contact ——— */
  const DonatePreview = ({ entry }) => {
    const data = dataOf(entry);
    const amounts = Array.isArray(data.amountPresets) ? data.amountPresets : [];
    const freqs = Array.isArray(data.frequencyOptions) ? data.frequencyOptions : [];

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Donate · live preview"),
      h("h1", { className: "preview-title" }, text(data.heading, "Donate")),
      data.description ? h("p", { className: "preview-lead" }, data.description) : null,
      amounts.length
        ? section(
            "Amounts",
            h(
              "div",
              { className: "preview-meta" },
              amounts.map((a, i) =>
                h("span", { className: "preview-tag", key: i }, `${a.label || a.value}`)
              )
            )
          )
        : null,
      freqs.length
        ? section(
            "Frequency",
            h(
              "div",
              { className: "preview-meta" },
              freqs.map((f, i) => h("span", { className: "preview-tag", key: i }, f.label))
            )
          )
        : null
    ]);
  };

  const GetInvolvedPreview = ({ entry }) => {
    const data = dataOf(entry);
    const ops = Array.isArray(data.opportunities) ? data.opportunities : [];

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Get Involved · live preview"),
      h("h1", { className: "preview-title" }, text(data.heading, "Get Involved")),
      data.intro ? h("p", { className: "preview-lead" }, data.intro) : null,
      ops.length
        ? h(
            "div",
            { className: "preview-cards" },
            ops.map((op, i) =>
              h("article", { className: "preview-card", key: i }, [
                h("h3", null, text(op.title, "Opportunity")),
                op.description ? h("p", null, op.description) : null,
                op.ctaLabel ? h("span", { className: "preview-btn" }, op.ctaLabel) : null
              ])
            )
          )
        : empty("Add opportunities to preview them.")
    ]);
  };

  const ContactPreview = ({ entry }) => {
    const data = dataOf(entry);
    const cta = data.cta || {};

    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Contact · live preview"),
      h("h1", { className: "preview-title" }, text(data.heading, "Contact Us")),
      data.intro ? h("p", { className: "preview-lead" }, data.intro) : null,
      metaRow([
        { label: "Email", value: data.email },
        { label: "Phone", value: data.phone },
        { label: "Address", value: data.address }
      ]),
      cta.label ? h("span", { className: "preview-btn" }, cta.label) : null
    ]);
  };

  /* ——— Team / Testimonials ——— */
  const TeamPreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Team member · live preview"),
      img(assetUrl(getAsset, data.photo), data.photoAlt || data.name, "preview-avatar"),
      h("h1", { className: "preview-title" }, text(data.name, "Team member")),
      data.role ? h("p", { className: "preview-lead" }, data.role) : null,
      data.bio ? h("p", null, data.bio) : null
    ]);
  };

  const TestimonialPreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Testimonial · live preview"),
      img(assetUrl(getAsset, data.photo), data.photoAlt || data.authorName, "preview-avatar"),
      h("blockquote", { className: "preview-quote" }, text(data.quote, "Quote")),
      h("p", null, [
        h("strong", null, text(data.authorName, "Author")),
        data.affiliation ? ` — ${data.affiliation}` : ""
      ])
    ]);
  };

  /* ——— Stats / Map ——— */
  const HomeStatsPreview = ({ entry }) => {
    const data = dataOf(entry);
    const items = Array.isArray(data.items) ? data.items : [];
    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Home stats · live preview"),
      items.length
        ? h(
            "div",
            { className: "preview-cards" },
            items.map((item, i) =>
              h("article", { className: "preview-card preview-stat", key: i }, [
                h("div", { className: "preview-stat-value" }, text(item.valueLabel, item.target)),
                h("p", null, text(item.description, ""))
              ])
            )
          )
        : empty("Add stat items.")
    ]);
  };

  const ImpactStatsPreview = ({ entry }) => {
    const data = dataOf(entry);
    const items = Array.isArray(data.items) ? data.items : [];
    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Impact stats · live preview"),
      items.length
        ? h(
            "div",
            { className: "preview-cards" },
            items.map((item, i) =>
              h("article", { className: "preview-card preview-stat", key: i }, [
                h(
                  "div",
                  { className: "preview-stat-value" },
                  `${item.prefix || ""}${item.target || 0}`
                ),
                h("h3", null, `${text(item.primaryLabel)} ${text(item.secondaryLabel)}`),
                item.description ? h("p", null, item.description) : null
              ])
            )
          )
        : empty("Add impact stats.")
    ]);
  };

  const campusPreviewCoords = (campus) => {
    const pinDesktop = campus.pinDesktop || {};
    const deskX = Number(pinDesktop.x);
    const deskY = Number(pinDesktop.y);
    if (Number.isFinite(deskX) && Number.isFinite(deskY)) {
      return { x: deskX, y: deskY };
    }
    const offset = campus.desktopOffset || campus.pinDesktopOffset || {};
    return {
      x: Number(campus.x || 0) + (Number(offset.x) || 0),
      y: Number(campus.y || 0) + (Number(offset.y) || 0)
    };
  };

  const signpostDirClass = (labelDir) => {
    if (labelDir === "flip") return " flip";
    if (labelDir === "below") return " below";
    return "";
  };

  const renderSignpost = (campus, opts = {}) => {
    const coords = campusPreviewCoords(campus);
    const soon = campus.status === "soon";
    const className = [
      "lnl-signpost",
      signpostDirClass(campus.labelDir),
      soon ? "is-soon-sign" : "",
      opts.visible ? "is-visible" : "",
      opts.reportOpen ? "report-open" : ""
    ]
      .filter(Boolean)
      .join(" ");

    const style = opts.positioned
      ? { left: `${coords.x}%`, top: `${coords.y}%` }
      : opts.style || null;

    const statA = campus.statA || {};
    const statB = campus.statB || {};
    const reportCopy = text(campus.report || campus.blurb, "Add a report summary or blurb.");

    return h(
      "div",
      {
        className,
        style,
        key: opts.key || campus.id || campus.abbr
      },
      [
        h(
          "div",
          {
            className: "lnl-signpost__label",
            tabIndex: 0,
            role: "button",
            "aria-label": `${text(campus.name, "Campus")} — impact report`
          },
          text(campus.abbr, campus.name || "NEW")
        ),
        h("div", { className: "lnl-signpost__report", role: "tooltip" }, [
          h("button", { type: "button", className: "lnl-signpost__close", "aria-label": "Close" }, "×"),
          h("p", null, [h("b", null, text(campus.name, "Campus name")), h("br"), reportCopy]),
          h("div", { className: "lnl-signpost__figures" }, [
            h("div", null, [
              h("b", null, text(statA.value, "—")),
              h("span", null, text(statA.label, "Stat A"))
            ]),
            h("div", null, [
              h("b", null, text(statB.value, "—")),
              h("span", null, text(statB.label, "Stat B"))
            ])
          ])
        ])
      ]
    );
  };

  const renderPin = (campus, opts = {}) => {
    const coords = campusPreviewCoords(campus);
    const soon = campus.status === "soon";
    return h("button", {
      type: "button",
      className: ["lnl-pin", soon ? "is-soon" : "", opts.active ? "is-active" : ""]
        .filter(Boolean)
        .join(" "),
      style: { left: `${coords.x}%`, top: `${coords.y}%` },
      "aria-label": text(campus.name, "Campus"),
      key: opts.key || `pin-${campus.id || campus.abbr}`
    });
  };

  const ImpactMapPreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    const header = data.header || {};
    const campuses = Array.isArray(data.campuses) ? data.campuses : [];
    const mapSrc = assetUrl(getAsset, data.mapImage);

    return h("div", { className: "preview-frame preview-page preview-impact-map" }, [
      kicker("Campus map · live signpost preview"),
      h("h1", { className: "preview-title" }, text(header.title, "Where We're Making Impact")),
      header.description ? h("p", { className: "preview-lead" }, header.description) : null,

      mapSrc
        ? h("div", { className: "preview-map-stage" }, [
            h("img", {
              className: "preview-map-img",
              src: mapSrc,
              alt: text(data.mapAlt, "Campus map")
            }),
            campuses.map((campus, i) =>
              renderPin(campus, { key: `map-pin-${campus.id || i}`, active: i === 0 })
            ),
            campuses.map((campus, i) =>
              renderSignpost(campus, {
                key: `map-sign-${campus.id || i}`,
                positioned: true,
                visible: true,
                reportOpen: false
              })
            )
          ])
        : empty("Upload a map image to preview pin and signpost placement."),

      h("p", { className: "preview-empty" }, "Hover a yellow label on the map to open its report."),

      section(
        "Signpost detail (as on the live site)",
        campuses.length
          ? h(
              "div",
              { className: "preview-signpost-gallery" },
              campuses.map((campus, i) =>
                h(
                  "article",
                  {
                    className: "preview-signpost-sample",
                    key: `sample-${campus.id || i}`
                  },
                  [
                    h(
                      "div",
                      { className: "preview-signpost-meta" },
                      [
                        h("strong", null, text(campus.abbr, "ID")),
                        " · ",
                        text(campus.place, "Place"),
                        " · ",
                        campus.status === "soon" ? "Expanding soon" : "Active",
                        " · ",
                        `dir: ${text(campus.labelDir, "up")}`,
                        " · ",
                        (() => {
                          const coords = campusPreviewCoords(campus);
                          return `${coords.x}% × ${coords.y}%`;
                        })()
                      ]
                    ),
                    h(
                      "div",
                      { className: "preview-signpost-stage" },
                      renderSignpost(campus, {
                        key: `detail-${campus.id || i}`,
                        visible: true,
                        reportOpen: true,
                        style: { left: "50%", top: "62%" }
                      })
                    )
                  ]
                )
              )
            )
          : empty("Add a campus to preview its signpost label, report, and stats.")
      )
    ]);
  };

  const SiteSettingsPreview = ({ entry, getAsset }) => {
    const data = dataOf(entry);
    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Site settings · live preview"),
      img(assetUrl(getAsset, data.logo), "Logo", "preview-thumb"),
      h("h1", { className: "preview-title" }, text(data.siteName, "Site name")),
      metaRow([
        { label: "SEO title", value: data.defaultSeoTitle },
        { label: "SEO description", value: data.defaultSeoDescription }
      ])
    ]);
  };

  /* Generic fallback for any unmatched page file */
  const GenericPagePreview = ({ entry }) => {
    const data = dataOf(entry);
    const hero = data.hero || {};
    return h("div", { className: "preview-frame preview-page" }, [
      kicker("Page · live preview"),
      h("h1", { className: "preview-title" }, text(hero.heading || data.heading || data.title, "Page")),
      h("pre", { className: "preview-json" }, JSON.stringify(data, null, 2))
    ]);
  };

  /* Register — files collection uses FILE names; folders use collection names */
  const filePreviews = {
    home: HomePreview,
    about: AboutPreview,
    impact: ImpactPreview,
    storiesPage: StoriesPagePreview,
    donate: DonatePreview,
    getInvolved: GetInvolvedPreview,
    contactUs: ContactPreview,
    homeStats: HomeStatsPreview,
    impactStats: ImpactStatsPreview,
    impactMap: ImpactMapPreview,
    site: SiteSettingsPreview
  };

  Object.keys(filePreviews).forEach((name) => {
    CMS.registerPreviewTemplate(name, filePreviews[name]);
  });

  CMS.registerPreviewTemplate("pages", GenericPagePreview);
  CMS.registerPreviewTemplate("stats", GenericPagePreview);
  CMS.registerPreviewTemplate("settings", GenericPagePreview);
  CMS.registerPreviewTemplate("blog", BlogPreview);
  CMS.registerPreviewTemplate("reports", BlogPreview);
  CMS.registerPreviewTemplate("team", TeamPreview);
  CMS.registerPreviewTemplate("testimonials", TestimonialPreview);
})();
