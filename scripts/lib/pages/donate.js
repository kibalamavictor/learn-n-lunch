const { escapeHtml, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { resolvePageSeo, buildOrganizationJsonLd } = require("../seo");
function renderDonate({ site, page }) {
  const options = page.supportOptions.map(item => `<li><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.description)}</li>`).join("");
  const body = `<main class="support-page">
    <header class="support-hero"><h1>LET’S PARTNER TOGETHER</h1></header>
    <section class="partner-intro"><h2>Thank you for your interest in partnering with Learn And Lunch!</h2><p>${escapeHtml(page.description)}</p><p>We welcome businesses, foundations, community groups and individuals who believe every student deserves the opportunity to learn without hunger. If you can support our work in one or more of the following ways, we’d love to hear from you.</p><ul class="partner-options">${options}</ul></section>
    <section class="partner-contact" aria-label="Contact our team"><p>If your foundation, business or organization would like to explore a partnership with Learn And Lunch to support student meals, strengthen campus welfare advocacy, advance food security research or expand access to higher education in Uganda, please contact our team at <a href="mailto:${escapeHtml(page.partnershipEmail)}">${escapeHtml(page.partnershipEmail)}</a>.</p></section>
  </main>`;
  const seo = resolvePageSeo({ site, page, canonicalPath: "/donate/", defaults: { title: `Support Us | ${site.siteName}`, description: page.description, ogImage: site.defaultOgImage } });
  return renderPage({ site, depth: 1, title: seo.title, description: seo.description, canonicalPath: seo.canonicalPath, ogImage: seo.ogImage, activePath: "/donate", structuredData: [buildOrganizationJsonLd(site)], footerCta: defaultFooterCta(1), body });
}
module.exports = { renderDonate };
