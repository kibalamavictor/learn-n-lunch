const { escapeHtml, resolveAsset, getPostCategorySlug, getPostSearchText } = require("../utils");
const { renderPage } = require("../partials");
const { renderStoryCarousel } = require("../carousel");

function renderFeaturedHero(depth, post) {
  if (!post) return "";
  const categorySlug = getPostCategorySlug(post);
  const searchText = getPostSearchText(post);

  return `
    <div class="st-hero-container stories-item" data-category="${escapeHtml(categorySlug)}" data-search="${escapeHtml(searchText)}">
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

function getPostsForCategory(posts, categorySlug) {
  return posts.filter((post) => getPostCategorySlug(post) === categorySlug);
}

function formatSectionTitle(title) {
  const parts = title.split(" & ");
  if (parts.length < 2) return escapeHtml(title);
  return `${escapeHtml(parts[0])} <br> ${escapeHtml(parts.slice(1).join(" & "))}`;
}

function renderCategorySection(depth, { categorySlug, title, posts, carouselId }) {
  if (!posts.length) return "";

  return `
  <div class="stories-category-section" data-category="${escapeHtml(categorySlug)}">
    <div class="donor-highlight-container" style="max-width: 1140px; margin: 0 auto; padding: 3.5rem 0 2rem;">
      <p class="stories-recents-title">${formatSectionTitle(title)}</p>
    </div>

    ${renderStoryCarousel({
      depth,
      posts,
      carouselId,
      sectionClass: "stories-results-carousel",
      sectionStyle: "background: white; padding: 0 20px 20px; max-width: 1140px; margin: 0 auto;"
    })}
  </div>`;
}

function renderStories({ site, page, publishedPosts }) {
  const depth = 1;
  const sortedPosts = [...publishedPosts].sort((a, b) => {
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return db - da;
  });

  const filters = Array.isArray(page.filters) ? page.filters : [{ label: "All", slug: "all" }];
  const categoryFilters = filters.filter((filter) => filter.slug !== "all");

  const filterButtons = filters
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

  const lead = sortedPosts[0];
  const recentsSection = `
  <div class="stories-category-section" data-category="all">
    <div class="donor-highlight-container" style="max-width: 1140px; margin: 0 auto; padding: 3.5rem 0 2rem;">
      <p class="stories-recents-title">RECENTS</p>
    </div>

    ${renderFeaturedHero(depth, lead)}

    ${renderStoryCarousel({
      depth,
      posts: sortedPosts,
      carouselId: "stories-recents",
      sectionClass: "stories-results-carousel",
      sectionStyle: "background: white; padding: 0 20px 56px; max-width: 1140px; margin: 0 auto;"
    })}
  </div>`;

  const categorySections = categoryFilters
    .map((filter) =>
      renderCategorySection(depth, {
        categorySlug: filter.slug,
        title: filter.label,
        posts: getPostsForCategory(sortedPosts, filter.slug),
        carouselId: `stories-${filter.slug}`
      })
    )
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
        <input type="text" id="storiesSearchInput" placeholder="Search stories..." aria-label="Search stories">
      </div>
      <button class="stories-search-btn" id="storiesSearchBtn" type="button">Search</button>
    </div>

    <div class="stories-filter-buttons">
      ${filterButtons}
    </div>
  </div>
</section>

<section class="stories-results" id="storiesResults">
  <p id="storiesEmptyState" class="stories-empty-state" hidden>No stories match your search. Try another keyword or filter.</p>

  ${recentsSection}

  ${categorySections}
</section>`;

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
