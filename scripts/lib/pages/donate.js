const { escapeHtml, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { resolvePageSeo, buildOrganizationJsonLd } = require("../seo");
function renderDonate({ site, page }) {
  const options = page.supportOptions.map(item => `<li><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.description)}</li>`).join("");
  const body = `<div class="support-page">
    <header class="support-hero"><h1>${escapeHtml(page.heading)}</h1></header>
    <section class="partner-intro"><h2>${escapeHtml(page.introHeading)}</h2><p>${escapeHtml(page.description)}</p><p>${escapeHtml(page.introBody)}</p><ul class="partner-options">${options}</ul></section>
    <section class="partner-contact" aria-label="${escapeHtml(page.contactLabel)}"><p>${escapeHtml(page.contactBody)} <a href="mailto:${escapeHtml(page.partnershipEmail)}">${escapeHtml(page.partnershipEmail)}</a>.</p></section>
  </div>`;
  const seo = resolvePageSeo({ site, page, canonicalPath: "/donate/", defaults: { title: `Support Us | ${site.siteName}`, description: page.description, ogImage: site.defaultOgImage } });
  return renderPage({ site, depth: 1, title: seo.title, description: seo.description, social: seo.social, canonicalPath: seo.canonicalPath, ogImage: seo.ogImage, activePath: "/donate", structuredData: [buildOrganizationJsonLd(site)], footerCta: defaultFooterCta(1), body });
}
module.exports = { renderDonate };
