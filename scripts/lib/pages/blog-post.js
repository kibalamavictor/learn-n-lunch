const { escapeHtml, resolveAsset, formatPublishDate, markdownToHtml, resolveMarkdownPaths, isReportPost, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { renderStoryCarousel } = require("../carousel");
const {
  buildCanonicalUrl,
  toAbsoluteAssetUrl,
  buildOrganizationJsonLd,
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

function renderPdfReportSection({ post, depth }) {
  const pdfUrl = resolveAsset(depth, post.reportPdf);
  const downloadLabel = post.reportPdfLabel || `${post.title} (PDF)`;
  const introHtml = post.body
    ? resolveMarkdownPaths(markdownToHtml(post.body), depth)
    : post.excerpt
      ? `<p class="pdf-report-intro">${escapeHtml(post.excerpt)}</p>`
      : "";

  return `
    <div class="pdf-report-section">
      ${introHtml}
      <div class="pdf-report-actions">
        <a href="${pdfUrl}" class="pdf-report-btn" download>
          Download PDF
        </a>
        <a href="${pdfUrl}" class="pdf-report-btn" target="_blank" rel="noopener noreferrer">
          Open in new tab
        </a>
      </div>
      <div class="pdf-report-viewer">
        <iframe
          src="${pdfUrl}"
          title="${escapeHtml(downloadLabel)}"
          class="pdf-report-frame"
        ></iframe>
      </div>
    </div>`;
}

function renderBlogPost({ site, post, relatedPosts }) {
  const depth = 2;
  const category = (post.tags && post.tags[0]) || "Story";
  const title = post.seoTitle || `${post.title} | ${site.siteName}`;
  const isPdfReport = Boolean(post.reportPdf);
  const relatedTitle = isReportPost(post)
    ? "MORE REPORTS<br> &amp; DOCUMENTS"
    : "PEOPLE<br> ALSO READ";

  const relatedSectionHtml =
    relatedPosts.length > 0
      ? `
<div class="donor-highlight-container stories-article" data-category="all" style="max-width: 1140px; margin: 0 auto; padding: 1.5rem 0 0;">
  <p class="stories-recents-title">${relatedTitle}</p>
</div>

${renderStoryCarousel({
  depth,
  posts: relatedPosts,
  carouselId: "blog-related",
  sectionClass: "stories-article",
  sectionStyle: "background: white; padding: 56px 20px 20px; max-width: 1140px; margin: 0 auto;"
})}`
      : "";

  const heroImageHtml = isPdfReport
    ? ""
    : `
    <div class="exam-story-image-wrapper">
      <img 
        src="${resolveAsset(depth, post.coverImage)}" 
        alt="${escapeHtml(post.coverImageAlt || post.title)}" 
        class="exam-story-hero-image"
      />
    </div>`;

  const mainContentHtml = isPdfReport
    ? renderPdfReportSection({ post, depth })
    : `
    <div class="blog-content">
        ${resolveMarkdownPaths(markdownToHtml(post.body), depth)}
    </div>`;

  const body = `
<div class="exam-story-container${isPdfReport ? " exam-story-container--pdf-report" : ""}">
  <div class="exam-story-header">
   <a href="${resolveAsset(depth, "stories/")}">  <button class="back-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
        </button>
    </a> 
    <div class="category-badge">${escapeHtml(category)}</div>
    <button class="share-button" type="button">
      Share
      <img src="${resolveAsset(depth, "students/students/share-icon.svg")}" alt="" />
    </button>
  </div>

  <div class="exam-story-content">
    <div class="exam-story-meta">
      <span class="publish-date">${formatPublishDate(post.publishedAt)}</span>
      ${
        post.author
          ? `<span class="exam-story-meta-sep" aria-hidden="true">·</span>
      <span class="story-author">By ${escapeHtml(post.author)}</span>`
          : ""
      }
    </div>

    <h1 class="exam-story-title">${escapeHtml(post.title).toUpperCase().replace(" MY", "<br> MY")}</h1>

    ${heroImageHtml}

    ${mainContentHtml}
  </div>
</div>

${relatedSectionHtml}`;

  const canonicalPath = `/stories/${post.slug}/`;
  const canonicalUrl = buildCanonicalUrl(site, canonicalPath);
  const ogImage = post.ogImage || post.coverImage;
  const imageUrl = ogImage ? toAbsoluteAssetUrl(site, ogImage) : "";
  const description = post.seoDescription || post.excerpt;

  return renderPage({
    site,
    depth,
    title,
    description,
    canonicalPath,
    ogImage,
    ogType: "article",
    structuredData: [
      buildOrganizationJsonLd(site),
      buildBlogPostingJsonLd({ site, post, canonicalUrl, imageUrl }),
      buildBreadcrumbJsonLd(site, [
        { name: "Home", path: "/" },
        { name: "Stories", path: "/stories/" },
        { name: post.title, path: canonicalPath }
      ])
    ],
    activePath: "/stories",
    footerCta: defaultFooterCta(depth),
    body
  });
}

module.exports = { renderBlogPost };
