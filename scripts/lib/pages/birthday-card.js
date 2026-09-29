const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");
const {
  resolvePageSeo,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

const THEMES = [
  { id: "purple", label: "Purple", bg: "#996efc" },
  { id: "yellow", label: "Yellow", bg: "#f6c33c" },
  { id: "blue", label: "Sky blue", bg: "#D3EEFF" },
  { id: "green", label: "Green", bg: "#2F9F82" },
  { id: "royal", label: "Royal blue", bg: "#0047e4" },
  { id: "coral", label: "Coral", bg: "#ff6f61" },
  { id: "black", label: "Black", bg: "#111111" }
];

function renderBirthdayCard({ site, page }) {
  const depth = 1;
  const logoSrc = resolveAsset(depth, "logo.png");
  const message = String(page.defaultMessage || "").trim();

  const swatches = THEMES.map(
    (theme, index) => `
        <button type="button" class="lnl-card__swatch${index === 0 ? " is-active" : ""}" data-swatch="${theme.bg}" style="--swatch: ${theme.bg}" aria-label="${escapeHtml(theme.label)}" aria-pressed="${index === 0 ? "true" : "false"}"></button>`
  ).join("");

  const body = `
<section class="lnl-poster lnl-card" id="birthday-card" data-logo="${logoSrc}">
  <div class="lnl-poster__screen">
    <div class="lnl-poster__intro">
      <p class="lnl-poster__eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.heading)}</h1>
      <p class="lnl-poster__lead">${escapeHtml(page.intro)}</p>
    </div>

    <div class="lnl-card__layout">
      <div class="lnl-poster__studio">
        <div class="lnl-poster__stage">
          <canvas class="lnl-poster__canvas" width="1024" height="1024" aria-label="Birthday card preview"></canvas>
          <p class="lnl-poster__empty" data-empty>${escapeHtml(page.emptyPrompt)}</p>
        </div>

        <input id="lnl-card-file" class="lnl-poster__file" type="file" accept="image/*" hidden>
        <div class="lnl-poster__actions">
          <label class="lnl-poster__btn" for="lnl-card-file" data-upload-label data-change="${escapeHtml(page.changeLabel)}">${escapeHtml(page.uploadLabel)}</label>
          <button type="button" class="lnl-poster__btn lnl-poster__btn--primary" data-share disabled>${escapeHtml(page.shareLabel)}</button>
        </div>
        <p class="lnl-poster__status" data-status role="status"></p>
      </div>

      <form class="lnl-card__fields" data-card-fields novalidate>
        <label class="lnl-card__field">
          <span>${escapeHtml(page.titleLabel)}</span>
          <input class="lnl-card__input" type="text" name="title" maxlength="40" value="${escapeHtml(page.defaultTitle)}" data-field="title">
        </label>
        <div class="lnl-card__field">
          <span>${escapeHtml(page.colorLabel)}</span>
          <div class="lnl-card__swatches" data-swatches>${swatches}</div>
        </div>
        <label class="lnl-card__field">
          <span>${escapeHtml(page.messageLabel)}</span>
          <textarea class="lnl-card__input lnl-card__textarea" name="message" rows="6" maxlength="320" data-field="message">${escapeHtml(message)}</textarea>
          <small>${escapeHtml(page.messageHint)}</small>
        </label>
        <label class="lnl-card__field">
          <span>${escapeHtml(page.ribbonLabel)}</span>
          <input class="lnl-card__input" type="text" name="ribbon" maxlength="24" value="${escapeHtml(page.defaultRibbon)}" data-field="ribbon">
        </label>
        <label class="lnl-card__field">
          <span>${escapeHtml(page.hashtagsLabel)}</span>
          <input class="lnl-card__input" type="text" name="hashtags" maxlength="60" value="${escapeHtml(page.defaultHashtags)}" data-field="hashtags">
        </label>
      </form>
    </div>
  </div>
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/birthday-card/",
    defaults: {
      title: `Birthday Card | ${site.siteName}`,
      description: page.intro,
      ogImage: page.ogImage || "/birthday-card/preview.jpg",
      ogImageAlt: page.ogImageAlt,
      keywords: "Learn And Lunch, birthday card, team celebration"
    }
  });

  return renderPage({
    site,
    depth,
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    ogImage: seo.ogImage,
    ogImageAlt: seo.ogImageAlt,
    keywords: seo.keywords,
    ogType: seo.ogType,
    structuredData: [
      buildOrganizationJsonLd(site),
      buildBreadcrumbJsonLd(site, [
        { name: "Home", path: "/" },
        { name: "Birthday Card", path: "/birthday-card/" }
      ])
    ].filter(Boolean),
    activePath: "/birthday-card",
    bodyClass: "lnl-poster-page",
    body,
    scripts: ["js/app.js", "js/birthday-card.js"]
  });
}

module.exports = { renderBirthdayCard };
