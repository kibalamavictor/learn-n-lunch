const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");

function renderSimplePage({ site, page, activePath, outputDepth = 1 }) {
  const depth = outputDepth;

  const body = `
<div class="lnl-hero-container">
  <div class="lnl-hero-content">
    <h1>${escapeHtml(page.heading)}</h1>
    <p>${escapeHtml(page.intro)}</p>
  </div>
</div>

<section class="mission-vision-section" style="padding-top: 0;">
  <div class="card mission-card" style="max-width: 760px; margin: 0 auto;">
    ${page.email ? `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(page.email)}">${escapeHtml(page.email)}</a></p>` : ""}
    ${page.phone ? `<p><strong>Phone:</strong> ${escapeHtml(page.phone)}</p>` : ""}
    ${page.address ? `<p><strong>Address:</strong> ${escapeHtml(page.address)}</p>` : ""}
    ${
      page.cta
        ? `<a href="${escapeHtml(page.cta.url)}" class="learn-lunch-cta" style="margin-top: 1.5rem;">
        <span>${escapeHtml(page.cta.label)}</span>
      </a>`
        : ""
    }
  </div>
</section>`;

  return renderPage({
    site,
    depth,
    title: `${page.title} | ${site.siteName}`,
    description: page.intro,
    activePath,
    footerCta: {
      title: "BE PART OF THE MOVEMENT.",
      buttonLabel: "Donate Now",
      buttonUrl: resolveAsset(depth, "donate/"),
      backgroundImage: "/footer-image-h.png",
      backgroundImageAlt: "Volunteers packing food",
      qrImage: "/qr-code.png",
      qrImageAlt: "QR Code"
    },
    body
  });
}

function renderGetInvolved({ site, page }) {
  const depth = 1;
  const cards = page.opportunities
    .map(
      (item) => `
  <div class="card vision-card">
    <h3 style="font-size: 1.5rem;">${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description)}</p>
    <a href="${escapeHtml(item.ctaUrl)}" class="learn-lunch-cta" style="margin-top: 1rem;">
      <span>${escapeHtml(item.ctaLabel)}</span>
    </a>
  </div>`
    )
    .join("\n");

  const body = `
<div class="lnl-hero-container">
  <div class="lnl-hero-content">
    <h1>${escapeHtml(page.heading)}</h1>
    <p>${escapeHtml(page.intro)}</p>
  </div>
</div>

<section class="mission-vision-section" style="flex-direction: column; gap: 2rem;">
  ${cards}
</section>`;

  return renderPage({
    site,
    depth,
    title: `${page.title} | ${site.siteName}`,
    description: page.intro,
    activePath: "/get-involved",
    footerCta: {
      title: "BE PART OF THE MOVEMENT.",
      buttonLabel: "Donate Now",
      buttonUrl: resolveAsset(depth, "donate/"),
      backgroundImage: "/footer-image-h.png",
      backgroundImageAlt: "Volunteers packing food",
      qrImage: "/qr-code.png",
      qrImageAlt: "QR Code"
    },
    body
  });
}

function renderContact({ site, page }) {
  return renderSimplePage({ site, page, activePath: "/contact-us" });
}

module.exports = { renderContact, renderGetInvolved };
