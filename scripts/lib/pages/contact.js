const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");

const CTA_VARIANTS = [
  "lnl-cta--green",
  "lnl-cta--yellow",
  "lnl-cta--blue"
];

const TAG_COLORS = ["#d3eeff", "#fdc039", "#7be4d3"];

function renderActionCards(items) {
  return items
    .map(
      (item, index) => `
  <div class="card vision-card">
    <div class="mm-tag" style="background:${TAG_COLORS[index % TAG_COLORS.length]};"></div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description)}</p>
    ${item.detail ? `<p class="lnl-card-detail">${item.detailHtml || escapeHtml(item.detail)}</p>` : ""}
    <a href="${escapeHtml(item.ctaUrl)}" class="learn-lunch-cta ${CTA_VARIANTS[index % CTA_VARIANTS.length]}">
      <span>${escapeHtml(item.ctaLabel)}</span>
    </a>
  </div>`
    )
    .join("\n");
}

function renderPageHero(page) {
  return `
<div class="lnl-hero-container lnl-hero-container--full">
  <div class="lnl-hero-content">
    <h1>${escapeHtml(page.heading)}</h1>
    <p>${escapeHtml(page.intro)}</p>
  </div>
</div>`;
}

function buildContactMethods(page) {
  const methods = [];

  if (page.email) {
    methods.push({
      title: "Email Us",
      description:
        "For partnerships, media inquiries, and volunteer opportunities, send us a message and our team will respond.",
      detail: page.email,
      detailHtml: `<a href="mailto:${escapeHtml(page.email)}">${escapeHtml(page.email)}</a>`,
      ctaLabel: page.cta?.label || "Email Us",
      ctaUrl: page.cta?.url || `mailto:${page.email}`
    });
  }

  if (page.phone) {
    const phoneHref = `tel:${page.phone.replace(/[^\d+]/g, "")}`;
    methods.push({
      title: "Call Us",
      description:
        "Prefer to speak directly? Call our team during business hours for quick support and questions.",
      detail: page.phone,
      detailHtml: `<a href="${escapeHtml(phoneHref)}">${escapeHtml(page.phone)}</a>`,
      ctaLabel: "Call Now",
      ctaUrl: phoneHref
    });
  }

  if (page.address) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.address)}`;
    methods.push({
      title: "Visit Us",
      description:
        "We are based in Kampala and welcome in-person meetings by appointment.",
      detail: page.address,
      ctaLabel: "Get Directions",
      ctaUrl: mapsUrl
    });
  }

  return methods;
}

function renderGetInvolved({ site, page }) {
  const depth = 1;
  const cards = renderActionCards(
    page.opportunities.map((item) => ({
      title: item.title,
      description: item.description,
      ctaLabel: item.ctaLabel,
      ctaUrl: item.ctaUrl
    }))
  );

  const body = `
${renderPageHero(page)}

<section class="mission-vision-section lnl-page-cards">
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
  const depth = 1;
  const cards = renderActionCards(buildContactMethods(page));

  const body = `
${renderPageHero(page)}

<section class="mission-vision-section lnl-page-cards">
  ${cards}
</section>`;

  return renderPage({
    site,
    depth,
    title: `${page.title} | ${site.siteName}`,
    description: page.intro,
    activePath: "/contact-us",
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

module.exports = { renderContact, renderGetInvolved };
