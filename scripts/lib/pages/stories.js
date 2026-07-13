const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");
const { renderStoryCarousel } = require("../carousel");

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

function normalizeTagSlug(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPostPrimaryTag(post) {
  return (post.tags && post.tags[0]) || "";
}

function getPostsForFilter({ publishedPosts, filter }) {
  if (!filter || filter.slug === "all") return publishedPosts;
  const filterSlug = normalizeTagSlug(filter.label || filter.slug);

  return publishedPosts.filter((post) => {
    const primary = getPostPrimaryTag(post);
    const primarySlug = normalizeTagSlug(primary);
    return primarySlug === filterSlug;
  });
}

function renderStories({ site, page, publishedPosts }) {
  const depth = 1;
  const sortedPosts = [...publishedPosts].sort((a, b) => {
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return db - da;
  });

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

  const filters = Array.isArray(page.filters) ? page.filters : [{ label: "All", slug: "all" }];

  const sectionsHtml = filters
    .map((filter, filterIndex) => {
      const categorySlug = filter.slug;
      const sectionLabel = filter.slug === "all" ? "RECENTS" : filter.label;
      const postsForFilter = getPostsForFilter({ publishedPosts: sortedPosts, filter });
      const lead = postsForFilter[0] || sortedPosts[0];
      const carouselPosts = postsForFilter.slice(0, 12);
      const carouselId = `stories-${categorySlug}-${filterIndex}`;

      const titleHtml =
        categorySlug === "all"
          ? `<div class="donor-highlight-container stories-article" data-category="all" style="max-width: 1140px; margin: 0 auto; padding: 3.5rem 0 2rem;">
      <p class="stories-recents-title">${escapeHtml(sectionLabel)}</p>
    </div>`
          : `<section class="campus-lunch-section stories-article" data-category="${escapeHtml(categorySlug)}">
  <p class="stories-recents-title">${escapeHtml(sectionLabel).replace(" & ", " <br> ")}</p>`;

      const heroBlock = categorySlug === "all" ? renderFeaturedHero(depth, lead) : "";

      const gridBlock = categorySlug === "events" || categorySlug === "reports" ? renderCampusGrid(depth, carouselPosts) : "";

      return `
    ${titleHtml}
    ${heroBlock}
    ${gridBlock}
    ${renderStoryCarousel({
      depth,
      posts: carouselPosts,
      carouselId,
      sectionClass: "stories-article",
      dataCategory: categorySlug,
      sectionStyle: "background: white; padding: 56px 20px 20px; max-width: 1140px; margin: 0 auto;"
    })}`;
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
