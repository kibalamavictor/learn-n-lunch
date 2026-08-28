const { escapeHtml, resolveAsset, getPostCategorySlug, getPostTagColor, sortPostsByDate, defaultFooterCta, imageDimensionAttrs } = require("../utils");
const { renderPage } = require("../partials");
const { renderImpactMap } = require("../render-impact-map");
const { resolvePageSeo, buildOrganizationJsonLd, buildBreadcrumbJsonLd } = require("../seo");

function getFacesCarouselPosts(posts, limit = 5) {
  const sorted = sortPostsByDate(posts);
  const studentPosts = sorted.filter((post) => getPostCategorySlug(post) === "students");
  if (studentPosts.length >= limit) return studentPosts.slice(0, limit);

  const usedSlugs = new Set(studentPosts.map((post) => post.slug));
  const fillers = sorted.filter(
    (post) => !usedSlugs.has(post.slug) && getPostCategorySlug(post) !== "reports" && !post.reportPdf
  );

  return [...studentPosts, ...fillers].slice(0, limit);
}

function renderImpactFacesCarousel(depth, posts, faces = {}) {
  const facesPosts = getFacesCarouselPosts(posts);
  if (!facesPosts.length) return "";

  const ctaLabel = faces.ctaLabel || "See More Student Stories";
  const ctaUrl = faces.ctaUrl
    ? faces.ctaUrl.startsWith("http")
      ? faces.ctaUrl
      : resolveAsset(depth, faces.ctaUrl.replace(/^\//, ""))
    : resolveAsset(depth, "stories/");

  const cards = facesPosts
    .map((post, index) => {
      const categorySlug = getPostCategorySlug(post);
      const tagColor = getPostTagColor(post);
      const postUrl = resolveAsset(depth, `stories/${post.slug}/`);

      return `
        <article class="impact-faces-card mm-card" data-index="${index}">
          <img src="${resolveAsset(depth, post.coverImage)}" alt="${escapeHtml(post.coverImageAlt || post.title)}" class="mm-img" loading="lazy">
          <span class="mm-tag mm-tag--${escapeHtml(categorySlug)}" style="background:${tagColor};"></span>
          <div class="mm-box">
            <p class="mm-head">${escapeHtml(post.excerpt || post.title)}</p>
            <a href="${postUrl}" class="mm-cta">Read more <span><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 18px; padding-top: 7px;" alt=""/></span></a>
          </div>
        </article>`;
    })
    .join("\n");

  return `
  <section class="impact-faces-section" aria-label="Student stories carousel">
    <div class="impact-faces-carousel" id="impactFacesCarousel">
      <button type="button" class="impact-faces-nav impact-faces-prev" aria-label="Previous story">
        <img src="${resolveAsset(depth, "pixelated-arrow-2.svg")}" width="20" height="20" alt=""/>
      </button>
      <button type="button" class="impact-faces-nav impact-faces-next" aria-label="Next story">
        <img src="${resolveAsset(depth, "pixelated-arrow.svg")}" width="20" height="20" alt=""/>
      </button>
      <div class="impact-faces-stage">
        ${cards}
      </div>
    </div>
    <div class="impact-faces-more-wrap">
      <a href="${ctaUrl}" class="impact-faces-more mm-more">${escapeHtml(ctaLabel)} <span><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 18px; padding-top: 4px;" alt=""/></span></a>
    </div>
  </section>`;
}

function renderScrollingBanner(bannerText) {
  const text = `${bannerText || "DRIVEN BY PASSION · POWERED BY PURPOSE · LEARN N' LUNCH ·"}  `;
  const bannerRepeats = Array.from({ length: 8 })
    .map(() => `<span class="banner-text-2">${escapeHtml(text)}</span>`)
    .join("\n      ");

  return `
  <div class="impact-scroll-banner">
    <div class="team-banner-2">
      ${bannerRepeats}
    </div>
  </div>`;
}

function renderImpactDownloadCard({
  depth,
  variant,
  heading,
  description,
  buttonLabel,
  file,
  squares
}) {
  const fileSrc = file ? resolveAsset(depth, String(file).replace(/^\//, "")) : "";
  const downloadBtn = fileSrc
    ? `<a class="lnl-mn-download" href="${escapeHtml(fileSrc)}" download>
          <span>${escapeHtml(buttonLabel || "Download")}</span>
        </a>`
    : "";

  return `
      <article class="lnl-mn-card lnl-mn-card--${variant}">
        ${squares}

        <span class="lnl-mn-chip lnl-mn-chip--${variant === "framework" ? "blue" : "green"}" aria-hidden="true"></span>
        <h2>${escapeHtml(heading)}</h2>
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        ${downloadBtn}
      </article>`;
}

function renderImpactDownloads(depth, strategicFramework = {}, impactReport = {}) {
  const framework = strategicFramework || {};
  const report = impactReport || {};

  return `
  <section id="lnl-more-next" class="lnl-more-next" aria-label="Download strategic framework and impact report">
    <div class="lnl-mn-grid">
      ${renderImpactDownloadCard({
        depth,
        variant: "framework",
        heading: framework.heading || "Strategic Framework 2025",
        description: framework.description || "",
        buttonLabel: framework.buttonLabel || "Download Framework",
        file: framework.file,
        squares: `<span class="lnl-mn-sq lnl-mn-sq--tl" aria-hidden="true"></span>
        <span class="lnl-mn-sq lnl-mn-sq--br" aria-hidden="true"></span>`
      })}

      ${renderImpactDownloadCard({
        depth,
        variant: "report",
        heading: report.heading || "Impact Report 2025",
        description: report.description || "",
        buttonLabel: report.buttonLabel || "Download Report",
        file: report.file,
        squares: `<span class="lnl-mn-sq lnl-mn-sq--br" aria-hidden="true"></span>`
      })}
    </div>
  </section>`;
}

function renderImpact({ site, page, stats, impactMap, publishedPosts = [] }) {
  const depth = 1;
  const faces = page.faces || {
    heading: page.facesHeading || "Faces Behind the Numbers",
    ctaLabel: "See More Student Stories",
    ctaUrl: "/stories/"
  };

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
            fetchpriority="high"
            decoding="async"
            ${imageDimensionAttrs(page.hero.image)}
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
    <p class="impact-hero-title">${escapeHtml(faces.heading || "Faces Behind the Numbers").replace("the Numbers", "the Numbers<br>")}</p>
  </div>

  ${renderImpactFacesCarousel(depth, publishedPosts, faces)}

  <img src="${resolveAsset(depth, "impact/impact/pixel-image.svg")}" class="pixel-image pixel-image--flipped" alt="" aria-hidden="true"/>

  ${renderImpactMap(depth, impactMap)}

  ${renderScrollingBanner(page.scrollBanner)}

  ${renderImpactDownloads(depth, page.strategicFramework, page.impactReport)}`;

  const footerCta = page.footerCta
    ? {
        ...page.footerCta,
        buttonUrl: page.footerCta.buttonUrl?.startsWith("http")
          ? page.footerCta.buttonUrl
          : resolveAsset(depth, String(page.footerCta.buttonUrl || "donate/").replace(/^\//, ""))
      }
    : defaultFooterCta(depth);

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/impact/",
    defaults: {
      title: `Our Impact | ${site.siteName}`,
      description: page.hero?.meaningBody || page.hero?.subtitle,
      ogImage: page.hero?.image
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
        { name: "Impact", path: "/impact/" }
      ])
    ],
    activePath: "/impact",
    scripts: ["js/app.js", "js/impact-map.js"],
    footerCta,
    body
  });
}

module.exports = { renderImpact };
