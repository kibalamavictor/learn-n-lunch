const { escapeHtml, resolveAsset, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { buildOrganizationJsonLd } = require("../seo");

function renderClosedPage({
  site,
  depth,
  canonicalPath,
  kicker,
  title,
  heading,
  description,
  body,
  action
}) {
  const actionHtml = action
    ? `<a class="lnl-summit__submit" href="${escapeHtml(resolveAsset(depth, action.href))}">${escapeHtml(action.label)}</a>`
    : "";

  const html = `
<section class="lnl-summit">
  <header class="lnl-summit__intro">
    <p class="lnl-summit__kicker">${escapeHtml(kicker)}</p>
    <h1>${escapeHtml(heading)}</h1>
    <div class="lnl-summit__lead">${body}</div>
    ${actionHtml}
  </header>
</section>`;

  return renderPage({
    site,
    depth,
    title,
    description,
    canonicalPath,
    robots: "noindex, follow",
    bodyClass: "lnl-summit-page",
    navbarStyle: "background-color: #D3EEFF;",
    body: html,
    footerCta: defaultFooterCta(depth),
    structuredData: [buildOrganizationJsonLd(site)]
  });
}

module.exports = { renderClosedPage };
