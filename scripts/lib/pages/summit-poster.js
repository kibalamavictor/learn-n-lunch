const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");
const {
  resolvePageSeo,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

function renderSummitPoster({ site, page }) {
  const depth = 1;
  const overlaySrc = resolveAsset(depth, "summit-poster/template-overlay.png") + "?v=4";
  const previewSrc = resolveAsset(depth, "summit-poster/template.jpg") + "?v=3";
  const shareCaption = String(page.shareCaption || "").trim();

  const body = `
<section class="lnl-poster" id="summit-poster" data-overlay="${overlaySrc}">
  <div class="lnl-poster__screen">
    <div class="lnl-poster__intro">
      <p class="lnl-poster__eyebrow">${escapeHtml(page.eventName)}</p>
      <h1>${escapeHtml(page.heading)}</h1>
      <p class="lnl-poster__lead">${escapeHtml(page.intro)}</p>
    </div>

    <div class="lnl-poster__studio">
      <div class="lnl-poster__stage">
        <canvas class="lnl-poster__canvas" width="1024" height="1024" aria-label="Summit poster preview"></canvas>
        <img class="lnl-poster__fallback" src="${previewSrc}" alt="${escapeHtml(page.ogImageAlt || "Summit poster template")}" width="1024" height="1024">
        <p class="lnl-poster__empty" data-empty>Upload a photo to place it in the frame. Drag to move. Pinch to zoom.</p>
      </div>
    </div>

    <input id="lnl-poster-file" class="lnl-poster__file" type="file" accept="image/*" hidden>
    <div class="lnl-poster__actions">
      <label class="lnl-poster__btn" for="lnl-poster-file" data-upload-label data-change="${escapeHtml(page.changeLabel)}">${escapeHtml(page.uploadLabel)}</label>
      <button type="button" class="lnl-poster__btn lnl-poster__btn--primary" data-share disabled>${escapeHtml(page.shareLabel)}</button>
    </div>
    <p class="lnl-poster__status" data-status role="status"></p>
  </div>
  <textarea class="lnl-poster__caption-source" data-caption-source readonly hidden>${escapeHtml(shareCaption)}</textarea>
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/ill-be-there/",
    defaults: {
      title: `I'll Be There | ${site.siteName}`,
      description: page.intro,
      ogImage: page.ogImage || "/summit-poster/template.jpg",
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
        { name: "I'll Be There", path: "/ill-be-there/" }
      ])
    ].filter(Boolean),
    activePath: "/ill-be-there",
    bodyClass: "lnl-poster-page",
    body,
    scripts: ["js/app.js", "js/summit-poster.js"]
  });
}

module.exports = { renderSummitPoster };
