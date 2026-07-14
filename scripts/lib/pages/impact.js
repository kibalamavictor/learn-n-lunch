const { escapeHtml, resolveAsset, getPostCategorySlug, getPostTagColor, sortPostsByDate } = require("../utils");
const { renderPage } = require("../partials");

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

function renderImpactFacesCarousel(depth, posts) {
  const facesPosts = getFacesCarouselPosts(posts);
  if (!facesPosts.length) return "";

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
            <p class="mm-head">${escapeHtml(post.title)}</p>
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
      <a href="${resolveAsset(depth, "stories/")}" class="impact-faces-more mm-more">See More Student Stories <span><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 18px; padding-top: 4px;" alt=""/></span></a>
    </div>
  </section>`;
}

function renderImpact({ site, page, stats, publishedPosts = [] }) {
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
  </div>

  ${renderImpactFacesCarousel(depth, publishedPosts)}

  <img src="${resolveAsset(depth, "impact/impact/pixel-image.svg")}" class="pixel-image pixel-image--flipped" alt="" aria-hidden="true"/>`;

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
