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
  variant,
  heading,
  description,
  buttonLabel,
  squares
}) {
  const downloadBtn = `<button type="button" class="lnl-mn-download" data-report-download data-report-key="${variant}" data-report-title="${escapeHtml(heading)}">
          <span>${escapeHtml(buttonLabel || "Download")}</span>
        </button>`;

  return `
      <article class="lnl-mn-card lnl-mn-card--${variant}">
        ${squares}

        <span class="lnl-mn-chip lnl-mn-chip--${variant === "framework" ? "blue" : "green"}" aria-hidden="true"></span>
        <h2>${escapeHtml(heading)}</h2>
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        ${downloadBtn}
      </article>`;
}

function renderDownloadModal(site, form = {}) {
  const prefix = form.headingPrefix || "Complete the form below to download our";
  const [markWord, ...restWords] = prefix.split(" ");
  const submitEmail = form.submitEmail || site.contact?.email || "info@learnandlunch.org";

  return `
  <dialog class="lnl-dl-modal" id="lnl-report-download" aria-labelledby="lnl-dl-title" data-submit-email="${escapeHtml(submitEmail)}" data-submit-endpoint="${escapeHtml(form.submitEndpoint || "")}">
    <button type="button" class="lnl-dl-modal__close" data-dl-close aria-label="Close">&times;</button>

    <form class="lnl-dl-form" data-dl-form novalidate>
      <h2 id="lnl-dl-title" class="lnl-dl-modal__title">
        <span class="lnl-dl-modal__mark">${escapeHtml(markWord)}</span> ${escapeHtml(restWords.join(" "))} <span data-dl-report></span>
      </h2>

      <div class="lnl-dl-form__grid">
        <label class="lnl-dl-field">
          <span>First name<span class="lnl-dl-field__req">*</span></span>
          <input class="form-input" type="text" name="firstName" autocomplete="given-name" required>
        </label>
        <label class="lnl-dl-field">
          <span>Last name</span>
          <input class="form-input" type="text" name="lastName" autocomplete="family-name">
        </label>
      </div>

      <label class="lnl-dl-field">
        <span>College or organization name</span>
        <input class="form-input" type="text" name="organization" autocomplete="organization">
      </label>

      <label class="lnl-dl-field">
        <span>Email<span class="lnl-dl-field__req">*</span></span>
        <input class="form-input" type="email" name="email" autocomplete="email" required>
      </label>

      <input type="text" name="_gotcha" class="lnl-dl-form__honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">

      <button type="submit" class="lnl-mn-download lnl-dl-form__submit">${escapeHtml(form.submitLabel || "Submit")}</button>
      <p class="lnl-dl-form__error" data-dl-error role="alert"></p>
      <p class="lnl-dl-form__note">*${escapeHtml(form.consentNote || "By submitting this form, you agree to receive emails about news and updates from Learn And Lunch.")}</p>
    </form>

    <div class="lnl-dl-success" data-dl-success hidden>
      <span class="lnl-mn-chip lnl-mn-chip--green" aria-hidden="true"></span>
      <h2 class="lnl-dl-modal__title" tabindex="-1" data-dl-success-title>${escapeHtml(form.successTitle || "Thank you! Your download is starting.")}</h2>
      <p>${escapeHtml(form.successBody || "If the PDF doesn't open automatically, use the button below.")}</p>
      <a class="lnl-mn-download" href="#" download data-dl-again>${escapeHtml(form.againLabel || "Download again")}</a>
    </div>
  </dialog>`;
}

function renderImpactDownloads(strategicFramework = {}, impactReport = {}) {
  const framework = strategicFramework || {};
  const report = impactReport || {};

  return `
  <section id="lnl-more-next" class="lnl-more-next" aria-label="Download strategic framework and impact report">
    <div class="lnl-mn-grid">
      ${renderImpactDownloadCard({
        variant: "framework",
        heading: framework.heading || "Strategic Framework 2025",
        description: framework.description || "",
        buttonLabel: framework.buttonLabel || "Download Framework",
        squares: `<span class="lnl-mn-sq lnl-mn-sq--tl" aria-hidden="true"></span>
        <span class="lnl-mn-sq lnl-mn-sq--br" aria-hidden="true"></span>`
      })}

      ${renderImpactDownloadCard({
        variant: "report",
        heading: report.heading || "Impact Report 2025",
        description: report.description || "",
        buttonLabel: report.buttonLabel || "Download Report",
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

  ${renderImpactDownloads(page.strategicFramework, page.impactReport)}

  ${renderDownloadModal(site, page.downloadForm)}`;

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
    scripts: ["js/app.js", "js/impact-map.js", "js/report-download.js"],
    footerCta,
    body
  });
}

module.exports = { renderImpact };
