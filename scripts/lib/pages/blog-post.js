const { escapeHtml, resolveAsset, formatPublishDate, markdownToHtml } = require("../utils");
const { renderPage } = require("../partials");
const { renderStoryCarousel } = require("../carousel");

function renderBlogPost({ site, post, relatedPosts }) {
  const depth = 2;
  const category = (post.tags && post.tags[0]) || "Story";
  const title = post.seoTitle || `${post.title} | ${site.siteName}`;

  const body = `
<div class="exam-story-container">
  <div class="exam-story-header">
   <a href="${resolveAsset(depth, "stories/")}">  <button class="back-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
        </button>
    </a> 
    <div class="category-badge">${escapeHtml(category)}</div>
  </div>

  <div class="exam-story-content">
    <div class="exam-story-meta">
      <span class="publish-date">${formatPublishDate(post.publishedAt)}</span>
      <button class="share-button" type="button">
        Share
        <img src="${resolveAsset(depth, "students/students/share-icon.svg")}" alt="" />
      </button>
    </div>

    <h1 class="exam-story-title">${escapeHtml(post.title).toUpperCase().replace(" MY", "<br> MY")}</h1>

    <div class="exam-story-image-wrapper">
      <img 
        src="${resolveAsset(depth, post.coverImage)}" 
        alt="${escapeHtml(post.coverImageAlt || post.title)}" 
        class="exam-story-hero-image"
      />
    </div>

    <div class="blog-content">
        ${markdownToHtml(post.body)}
    </div>
  </div>
</div>

<div class="donor-highlight-container stories-article" data-category="all" style="max-width: 1140px; margin: 0 auto; padding: 1.5rem 0 0;">
  <p class="stories-recents-title">PEOPLE<br> ALSO READ</p>
</div>

${renderStoryCarousel({
  depth,
  posts: relatedPosts,
  carouselId: "blog-related",
  sectionClass: "stories-article",
  sectionStyle: "background: white; padding: 56px 20px 20px; max-width: 1140px; margin: 0 auto;"
})}`;

  return renderPage({
    site,
    depth,
    title,
    description: post.seoDescription || post.excerpt,
    activePath: "/stories",
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

module.exports = { renderBlogPost };
