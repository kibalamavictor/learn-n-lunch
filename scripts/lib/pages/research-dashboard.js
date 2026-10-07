const { escapeHtml } = require("../utils");
const { renderPage } = require("../partials");
const { resolvePageSeo, buildOrganizationJsonLd } = require("../seo");

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderResearchDashboard({ site, page, study, canonicalPath, formPath }) {
  const depth = 2;
  const heading = page.heading;

  const body = `
<section class="lnl-dash" id="research-dashboard"
  data-endpoint="${escapeHtml(page.submitEndpoint || "")}"
  data-form-path="${escapeHtml(formPath)}"
  data-conducted-by="${escapeHtml(page.conductedBy || "")}">
  <header class="lnl-dash__intro">
    <p class="lnl-summit__kicker">Live research dashboard</p>
    <h1>${escapeHtml(heading)}</h1>
    <p class="lnl-summit__tagline">${escapeHtml(page.tagline)}</p>
    <ul class="lnl-summit__meta-list">
      <li class="lnl-summit__meta lnl-dash__status" data-status><span class="lnl-dash__dot"></span><span data-status-text>Connecting…</span></li>
      <li class="lnl-summit__meta lnl-dash__access" data-access hidden></li>
    </ul>
  </header>

  <form class="lnl-dash__lock" data-lock hidden>
    <p class="lnl-summit__kicker">Research team only</p>
    <h2>This dashboard is private</h2>
    <p>Responses are confidential. Enter the research team's access key to view the live results.</p>
    <label class="lnl-summit__field">
      <span>Access key</span>
      <input class="form-input" type="password" name="key" autocomplete="current-password" required>
    </label>
    <p class="lnl-summit__error" data-lock-error role="alert"></p>
    <button type="submit" class="lnl-summit__submit">Open dashboard</button>
  </form>

  <div class="lnl-dash__toolbar" data-toolbar hidden>
    <div class="lnl-dash__filters" data-filters></div>
    <div class="lnl-dash__actions">
      <button type="button" class="lnl-dash__btn" data-refresh>Refresh</button>
      <button type="button" class="lnl-dash__btn" data-slides-open>Slides</button>
      <button type="button" class="lnl-dash__btn" data-present hidden>Present &amp; QR</button>
      <button type="button" class="lnl-dash__btn" data-print>Print / PDF</button>
      <button type="button" class="lnl-dash__btn lnl-dash__btn--ghost" data-signout hidden>Sign out</button>
    </div>
  </div>

  <div class="lnl-dash__body" data-dashboard aria-live="polite"></div>

  <div class="lnl-dash__present" data-present-panel role="dialog" aria-modal="true" aria-labelledby="dash-present-title" hidden>
    <div class="lnl-dash__present-card">
      <button type="button" class="lnl-dash__close" data-present-close aria-label="Close">×</button>
      <p class="lnl-summit__kicker">Presentation mode</p>
      <h2 id="dash-present-title">Scan to explore the live results</h2>
      <div class="lnl-dash__present-grid">
        <img class="lnl-dash__qr" data-qr alt="QR code linking to this dashboard" width="320" height="320">
        <div>
          <p class="lnl-dash__present-url" data-present-url></p>
          <p class="lnl-dash__present-state" data-present-state></p>
          <button type="button" class="lnl-summit__submit" data-public-toggle></button>
          <p class="lnl-dash__fine">While open, anyone with the link sees aggregated results only. Filters, written answers and groups smaller than ${
            study.analysis.publicMinCell
          } students stay hidden.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="lnl-dash__slides" data-slides role="dialog" aria-modal="true" aria-label="Presentation of live results" hidden>
    <div class="lnl-dash__slide" data-slide aria-live="polite"></div>
    <div class="lnl-dash__slides-bar">
      <button type="button" class="lnl-dash__btn" data-slide-prev aria-label="Previous slide">←</button>
      <span class="lnl-dash__slide-count" data-slide-count></span>
      <button type="button" class="lnl-dash__btn" data-slide-next aria-label="Next slide">→</button>
      <button type="button" class="lnl-dash__btn lnl-dash__btn--ghost" data-slide-full>Full screen</button>
      <button type="button" class="lnl-dash__btn lnl-dash__btn--ghost" data-slide-close aria-label="Exit presentation">Exit</button>
    </div>
    <div class="lnl-dash__slides-progress"><span data-slide-progress></span></div>
  </div>

  <noscript><p class="lnl-study__notice">Please enable JavaScript to view the dashboard.</p></noscript>
  <script type="application/json" data-study-json>${jsonForScript(study)}</script>
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath,
    defaults: {
      title: `Live dashboard · ${heading} | ${site.siteName}`,
      description: page.tagline,
      ogImage: page.ogImage || site.defaultOgImage,
      ogImageAlt: page.ogImageAlt
    }
  });

  return renderPage({
    site,
    depth,
    title: `Live dashboard · ${heading} | ${site.siteName}`,
    description: seo.description,
    canonicalPath,
    ogImage: seo.ogImage,
    ogImageAlt: seo.ogImageAlt,
    ogType: seo.ogType,
    robots: "noindex, nofollow",
    structuredData: [buildOrganizationJsonLd(site)].filter(Boolean),
    activePath: canonicalPath.replace(/\/$/, ""),
    bodyClass: "lnl-summit-page lnl-dash-page",
    body,
    scripts: ["js/app.js", "js/research-analytics.js", "js/research-dashboard.js"]
  });
}

module.exports = { renderResearchDashboard };
