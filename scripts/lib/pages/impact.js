const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");

function renderImpact({ site, page, stats }) {
  const depth = 1;

  const statsHtml = stats.items
    .map(
      (stat) => `
    <div class="stats-showcase-section">
    <div class="stats-showcase-container">
      <div class="stats-main-headline">
        <span class="stats-number-box" data-target="${stat.target}">0</span>
        <span class="stats-text-primary">${escapeHtml(stat.primaryLabel)}</span>
      </div>
      
      <h2 class="stats-text-secondary">${escapeHtml(stat.secondaryLabel)}</h2>
      
      <p class="stats-description">
        ${escapeHtml(stat.description)}
      </p>
    </div>
    </div>`
    )
    .join("\n");

  const body = `
  <div class="impact-hero-section">
    <div class="impact-hero-top">
      <h1 class="impact-hero-title">${escapeHtml(page.hero.heading)}</h1>
      <p class="impact-hero-subtitle">${escapeHtml(page.hero.subtitle).replace("this hidden crisis visible", "this hidden crisis visible<br>")}</p>
    </div>

    <img src="${resolveAsset(depth, "impact/impact/pixel-image.svg")}" class="pixel-image"/>

    <div class="impact-hero-content">
      <div class="impact-hero-image-container">
        <div class="impact-hero-image-frame">
          <img 
            src="${resolveAsset(depth, page.hero.image)}" 
            alt="${escapeHtml(page.hero.imageAlt)}" 
            class="impact-hero-image"
          />
        </div>
      </div>

      <div class="impact-hero-text">
        <h2 class="impact-why-title">${escapeHtml(page.hero.meaningHeading).replace("Means to Us", "Means <br> to Us")}</h2>
        
        <div class="impact-description">
          <p class="impact-paragraph">
            ${escapeHtml(page.hero.meaningBody)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="artwork-container">
    <img src="${resolveAsset(depth, "impact/impact/impact-artwork-1.png")}" class="hide-artwork"/>
  </div>

  <div class="impact-hero-top bottom">
    <img src="${resolveAsset(depth, "impact/impact/Doodle.png")}" class="bottom-image"/>
    <p class="impact-hero-title">${escapeHtml(page.numbersHeading).replace("Tell the Story", "Tell the Story<br>")}</p>
  </div>

  ${statsHtml}

  <div class="impact-hero-top bottom">
    <p class="impact-hero-title">${escapeHtml(page.facesHeading).replace("the Numbers", "the Numbers<br>")}</p>
  </div>`;

  return renderPage({
    site,
    depth,
    title: site.defaultSeoTitle,
    description: site.defaultSeoDescription,
    activePath: "/impact",
    scripts: ["js/app.js"],
    footerCta: {
      title: "BE PART OF THE MOVEMENT.",
      buttonLabel: "Donate Now",
      buttonUrl: resolveAsset(depth, "donate/"),
      backgroundImage: "/students/students/students-footer.png",
      backgroundImageAlt: "Volunteers packing food",
      qrImage: "/qr-code.png",
      qrImageAlt: "QR Code"
    },
    body
  });
}

module.exports = { renderImpact };
