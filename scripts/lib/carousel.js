const { escapeHtml, resolveAsset } = require("./utils");

const TAG_COLORS = ["#d3eeff", "#fdc039", "#7be4d3", "#ffd8a8"];

function renderStoryCarousel({
  depth,
  posts,
  carouselId,
  sectionClass = "",
  sectionStyle = "",
  dataCategory = "all"
}) {
  if (!posts || posts.length === 0) return "";

  const cards = posts
    .map((post, index) => {
      const tagColor = TAG_COLORS[index % TAG_COLORS.length];
      const postUrl = resolveAsset(depth, `stories/${post.slug}/`);
      return `
            <article class="mm-card">
              <img src="${resolveAsset(depth, post.coverImage)}" alt="${escapeHtml(post.coverImageAlt || post.title)}" class="mm-img" loading="lazy">
              <span class="mm-tag" style="background:${tagColor};"></span>
              <div class="mm-box">
                <p class="mm-head">${escapeHtml(post.title)}</p>
                <a href="${postUrl}" class="mm-cta">Read more <span><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 18px; padding-top: 7px;"/></span></a>
              </div>
            </article>`;
    })
    .join("\n");

  return `
<section class="mm-section ${sectionClass}" data-carousel-id="${carouselId}" data-category="${dataCategory}"${sectionStyle ? ` style="${sectionStyle}"` : ""}>
    <div class="mm-container">
      <div class="mm-carousel-area">
        <div class="mm-nav">
          <button class="mm-nav-btn mm-prev-btn" data-carousel="${carouselId}" aria-label="Previous stories">
            <img src="${resolveAsset(depth, "pixelated-arrow-2.svg")}" style="width: 20px;"/>
          </button>
          <button class="mm-nav-btn mm-next-btn" data-carousel="${carouselId}" aria-label="Next stories">
            <img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 20px;"/>
          </button>
        </div>

        <div class="mm-carousel-viewport">
          <div class="mm-carousel-track" data-carousel-track="${carouselId}">
            ${cards}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

module.exports = { renderStoryCarousel, TAG_COLORS };
