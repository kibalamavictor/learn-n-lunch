const { escapeHtml, resolveAsset, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { resolvePageSeo, buildOrganizationJsonLd, buildBreadcrumbJsonLd } = require("../seo");

function renderDonate({ site, page }) {
  const depth = 1;

  const amountOptions = page.amountPresets
    .map(
      (preset) => `
    <div class="donation-option">
      <button type="button" class="amount-option" data-amount="${preset.value}" data-default="${escapeHtml(preset.label)}">${escapeHtml(preset.label)}</button>
      <p class="amount-desc">${escapeHtml(preset.description)}</p>
    </div>`
    )
    .join("\n");

  const frequencyOptions = page.frequencyOptions
    .map((option) => {
      const smiley =
        option.label === "Monthly"
          ? `<img src="${resolveAsset(depth, "donate/donate/smiley.png")}" class="smile-icon"/>`
          : "";
      const note = option.note
        ? `<p class="frequency-note">${escapeHtml(option.note)}</p>`
        : "";
      return `
    <div class="frequency-option">
      <button type="button" class="frequency-btn${option.isDefault ? " active-frequency" : ""}" data-default="${escapeHtml(option.label)}">
        ${smiley}
        ${escapeHtml(option.label)}
      </button>
      ${note}
    </div>`;
    })
    .join("\n");

  const body = `
<div class="donation-form-container">
  <div class="donation-form-header">
    <h1 class="donation-main-title">${escapeHtml(page.heading)}</h1>
    <p class="donation-description">
      ${escapeHtml(page.description)}
    </p>
  </div>

  <form class="donation-form">
    <section class="form-section">
      <label class="section-label">Donation Amount:</label>
      <div class="donation-amount-grid">
        ${amountOptions}
        <div class="donation-option">
          <button type="button" class="amount-option" data-amount="custom" data-default="Other">Other</button>
          <p class="amount-desc">Custom Amount</p>
          <input type="number" id="custom-amount-input" class="custom-amount-input" placeholder="Enter amount" min="1" step="1" inputmode="numeric" style="display:none;">
        </div>
      </div>
    </section>

    <section class="form-section">
      <label class="section-label">Donation Frequency:</label>
      <div class="frequency-options">
        ${frequencyOptions}
      </div>
    </section>

    <section class="form-section">
      <label class="section-label">Donor Details:</label>
      <div class="form-group">
        <label class="input-label">${escapeHtml(page.fieldLabels.fullName)}</label>
        <input type="text" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="input-label">${escapeHtml(page.fieldLabels.email)}</label>
        <input type="email" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="input-label">${escapeHtml(page.fieldLabels.phone)}</label>
        <div class="phone-input-group">
          <select class="country-code-select" aria-label="Country code">
            <option value="+256">+256</option>
            <option value="+254">+254</option>
            <option value="+255">+255</option>
            <option value="+250">+250</option>
            <option value="+257">+257</option>
            <option value="+211">+211</option>
            <option value="+251">+251</option>
            <option value="+243">+243</option>
            <option value="+260">+260</option>
            <option value="+263">+263</option>
            <option value="+27">+27</option>
            <option value="+234">+234</option>
            <option value="+233">+233</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
            <option value="+49">+49</option>
            <option value="+33">+33</option>
            <option value="+31">+31</option>
            <option value="+46">+46</option>
            <option value="+41">+41</option>
            <option value="+971">+971</option>
            <option value="+91">+91</option>
            <option value="+86">+86</option>
            <option value="+61">+61</option>
          </select>
          <input type="tel" class="form-input phone-input" />
        </div>
      </div>
    </section>

    <section class="form-section">
      <label class="section-label">Payment Options:</label>
      <div class="payment-methods-grid">
        <button type="button" class="payment-method-btn">
          <img src="${resolveAsset(depth, "donate/donate/mtn-momo.png")}" alt="MoMo" class="payment-logo" />
        </button>
        <button type="button" class="payment-method-btn">
          <img src="${resolveAsset(depth, "donate/donate/airtel-money.png")}" alt="Airtel Money" class="payment-logo" />
        </button>
      </div>
    </section>

    <section class="form-section">
      <label class="section-label">Checkbox:</label>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="updates-checkbox" class="custom-checkbox" />
        <label for="updates-checkbox" class="checkbox-label">
          ${escapeHtml(page.fieldLabels.updatesCheckbox)}
        </label>
      </div>
    </section>
  </form>
</div>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/donate/",
    defaults: {
      title: `Donate | ${site.siteName}`,
      description: page.description,
      ogImage: site.defaultOgImage
    }
  });

  return renderPage({
    site,
    depth,
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    ogImage: seo.ogImage,
    ogType: seo.ogType,
    structuredData: [
      buildOrganizationJsonLd(site),
      buildBreadcrumbJsonLd(site, [
        { name: "Home", path: "/" },
        { name: "Donate", path: "/donate/" }
      ])
    ],
    activePath: "/donate",
    footerCta: defaultFooterCta(depth),
    body
  });
}

module.exports = { renderDonate };
