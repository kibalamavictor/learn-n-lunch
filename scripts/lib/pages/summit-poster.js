const { escapeHtml, resolveAsset, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const {
  resolvePageSeo,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

function renderSummitPoster({ site, page }) {
  const depth = 1;
  const overlaySrc = resolveAsset(depth, "summit-poster/template-overlay.png");
  const previewSrc = resolveAsset(depth, "summit-poster/template.png");

  const body = `
<section class="lnl-poster" id="summit-poster" data-overlay="${overlaySrc}">
  <div class="lnl-poster__intro">
    <p class="lnl-poster__eyebrow">${escapeHtml(page.eventName)}</p>
    <h1>${escapeHtml(page.heading)}</h1>
    <p class="lnl-poster__lead">${escapeHtml(page.intro)}</p>
    <ul class="lnl-poster__meta">
      <li>
        <span class="lnl-poster__meta-label">When</span>
        <span>${escapeHtml(page.eventDate)}</span>
      </li>
      <li>
        <span class="lnl-poster__meta-label">Where</span>
        <span>${escapeHtml(page.eventVenue)}</span>
      </li>
      <li>
        <span class="lnl-poster__meta-label">Share</span>
        <span>${escapeHtml(page.hashtag)}</span>
      </li>
    </ul>
  </div>

  <div class="lnl-poster__studio">
    <div class="lnl-poster__stage">
      <canvas class="lnl-poster__canvas" width="1024" height="1024" aria-label="Summit poster preview"></canvas>
      <img class="lnl-poster__fallback" src="${previewSrc}" alt="${escapeHtml(page.ogImageAlt || "Summit poster template")}" width="1024" height="1024">
      <p class="lnl-poster__empty" data-empty>Upload a photo to place it in the frame. Drag to move. Pinch or use the slider to zoom.</p>
    </div>

    <div class="lnl-poster__controls">
      <input id="lnl-poster-file" class="lnl-poster__file" type="file" accept="image/*" hidden>
      <div class="lnl-poster__actions">
        <label class="lnl-poster__btn" for="lnl-poster-file" data-upload-label data-change="${escapeHtml(page.changeLabel)}">${escapeHtml(page.uploadLabel)}</label>
        <button type="button" class="lnl-poster__btn lnl-poster__btn--primary" data-download disabled>${escapeHtml(page.downloadLabel)}</button>
        <button type="button" class="lnl-poster__btn" data-share hidden>${escapeHtml(page.shareLabel)}</button>
      </div>

      <label class="lnl-poster__zoom">
        <span>Zoom</span>
        <input type="range" min="100" max="300" value="100" step="1" data-zoom disabled>
      </label>

      <button type="button" class="lnl-poster__reset" data-reset disabled>${escapeHtml(page.resetLabel)}</button>
      <p class="lnl-poster__privacy">${escapeHtml(page.privacyNote)}</p>
      <p class="lnl-poster__status" data-status role="status"></p>
    </div>
  </div>
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/summit-poster/",
    defaults: {
      title: `I'll Be There | ${site.siteName}`,
      description: page.intro,
      ogImage: page.ogImage || "/summit-poster/template.png",
      ogImageAlt: page.ogImageAlt,
      keywords: "Campus Food Security Summit, KIU, Ending Campus Hunger, Learn And Lunch"
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
        { name: "I'll Be There", path: "/summit-poster/" }
      ])
    ].filter(Boolean),
    activePath: "/summit-poster",
    bodyClass: "lnl-poster-page",
    footerCta: defaultFooterCta(depth),
    body,
    scripts: ["js/app.js", "js/summit-poster.js"]
  });
}

module.exports = { renderSummitPoster };
