const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");
const { renderStoryCarousel } = require("../carousel");

function findPostBySlug(posts, slug) {
  return posts.find((post) => post.slug === slug);
}

function renderFeaturedHero(depth, post) {
  if (!post) return "";
  return `
    <div class="st-hero-container stories-article" data-category="all">
        <div class="makerere-lunch-section">
            <div class="makerere-lunch-image-wrapper">
                <img src="${resolveAsset(depth, post.coverImage)}" alt="${escapeHtml(post.coverImageAlt || post.title)}">
            </div>
            
            <div class="makerere-lunch-content">
                <h2 class="makerere-lunch-title">${escapeHtml(post.title)}</h2>
                <p class="makerere-lunch-description">${escapeHtml(post.excerpt)}</p>
                <a href="${resolveAsset(depth, `stories/${post.slug}/`)}" class="makerere-lunch-cta-btn">
                Read more
                <span class="makerere-lunch-arrow"><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" class="arrow-move" style="width: 20px; "/></span>
                </a>
            </div>
        </div>
    </div>`;
}

function renderCampusGrid(depth, posts) {
  if (!posts.length) return "";
  const [main, ...rest] = posts;
  const miniCards = rest
    .slice(0, 2)
    .map(
      (post) => `
    <div class="campus-mini-card">
      <img src="${resolveAsset(depth, post.coverImage)}" alt="${escapeHtml(post.coverImageAlt || post.title)}" class="campus-mini-image" />
      <div class="campus-mini-content">
        <p class="campus-mini-title">${escapeHtml(post.title)}</p>
        <a href="${resolveAsset(depth, `stories/${post.slug}/`)}" class="campus-feature-button">
          Read more <span class="arrow">
            <img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 15px;"/>
          </span>
        </a>
      </div>
      <span class="campus-feature-tag"></span>
    </div>`
    )
    .join("\n");

  return `
<section class="campus-lunch-section stories-article" data-category="events">
  <div class="campus-lunch-grid">
    <div class="campus-feature-card main-card">
      <img src="${resolveAsset(depth, main.coverImage)}" alt="${escapeHtml(main.coverImageAlt || main.title)}" class="campus-feature-image" />
      <div class="campus-feature-content">
        <h3 class="campus-feature-title">${escapeHtml(main.title)}</h3>
        <p class="campus-feature-text">${escapeHtml(main.excerpt)}</p>
        <a href="${resolveAsset(depth, `stories/${main.slug}/`)}" class="campus-feature-button">
          Read more <span class="arrow">
            <img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 15px;"/>
          </span>
        </a>
      </div>
      <span class="campus-feature-tag"></span>
    </div>
    ${miniCards}
  </div>
</section>`;
}

function renderStories({ site, page, publishedPosts }) {
  const depth = 1;
  const postsBySlug = Object.fromEntries(publishedPosts.map((post) => [post.slug, post]));

  const filterButtons = page.filters
    .map((filter, index) => {
      const classMap = {
        all: "white",
        students: "blue",
        events: "yellow",
        reports: "mint",
        donors: "dark"
      };
      const className = classMap[filter.slug] || "white";
      return `<button class="stories-filter-btn ${className}${index === 0 ? " active" : ""}" data-category="${escapeHtml(filter.slug)}">${escapeHtml(filter.label)}</button>`;
    })
    .join("\n      ");

  const sectionsHtml = page.featuredSections
    .map((section, sectionIndex) => {
      const lead = postsBySlug[section.leadPostSlug] || publishedPosts[0];
      const sectionPosts = section.postSlugs
        .map((slug) => postsBySlug[slug])
        .filter(Boolean);
      const carouselPosts = lead ? [lead, ...sectionPosts].slice(0, 4) : sectionPosts.slice(0, 4);
      const carouselId = `stories-${section.categorySlug}-${sectionIndex}`;

      const titleHtml =
        section.categorySlug === "all"
          ? `<div class="donor-highlight-container stories-article" data-category="all" style="max-width: 1140px; margin: 0 auto; padding: 3.5rem 0 2rem;">
      <p class="stories-recents-title">${escapeHtml(section.sectionLabel)}</p>
    </div>`
          : `<section class="campus-lunch-section stories-article" data-category="${escapeHtml(section.categorySlug)}">
  <p class="stories-recents-title">${escapeHtml(section.sectionLabel).replace(" & ", " <br> ")}</p>`;

      const heroBlock =
        section.categorySlug === "all" || section.categorySlug === "donors"
          ? renderFeaturedHero(depth, lead)
          : "";

      const gridBlock =
        section.categorySlug === "events" || section.categorySlug === "reports"
          ? renderCampusGrid(depth, carouselPosts)
          : "";

      const closeTag = section.categorySlug !== "all" && section.categorySlug !== "donors" ? "" : "";

      return `
    ${titleHtml}
    ${heroBlock}
    ${gridBlock}
    ${renderStoryCarousel({
      depth,
      posts: carouselPosts,
      carouselId,
      sectionClass: "stories-article",
      dataCategory: section.categorySlug,
      sectionStyle:
        section.categorySlug === "all"
          ? "background: white; padding: 56px 20px 20px; max-width: 1140px; margin: 0 auto;"
          : "background: white; padding: 56px 20px 20px; max-width: 1140px; margin: 0 auto;"
    })}
    ${closeTag}`;
    })
    .join("\n");

  const body = `
<section class="stories-section">
  <div class="stories-container">
    <div class="stories-text-area">
      <h1 class="stories-hero-heading">${escapeHtml(page.hero.heading).replace(" & ", " <br> ")}</h1>
      <div class="stories-hero-desc">
        <p>${escapeHtml(page.hero.description)}</p>
      </div>
    </div>

    <div class="stories-search-bar">
      <div class="stories-search-input">
        <input type="text" id="storiesSearchInput" placeholder="................">
      </div>
      <button class="stories-search-btn" id="storiesSearchBtn">Search</button>
    </div>

    <div class="stories-filter-buttons">
      ${filterButtons}
    </div>
  </div>
</section>

${sectionsHtml}`;

  return renderPage({
    site,
    depth,
    title: site.defaultSeoTitle,
    description: site.defaultSeoDescription,
    activePath: "/stories",
    footerCta: {
      title: "BE PART OF THE MOVEMENT.",
      buttonLabel: "Donate Now",
      buttonUrl: resolveAsset(depth, "donate/"),
      backgroundImage: "/stories/stories/stories-footer.png",
      backgroundImageAlt: "Volunteers packing food",
      qrImage: "/qr-code.png",
      qrImageAlt: "QR Code"
    },
    body
  });
}

module.exports = { renderStories };
