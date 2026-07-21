const { escapeHtml, resolveAsset, getPostTagColor, getPostCategorySlug } = require("../utils");
const { renderPage } = require("../partials");

function renderHome({ site, page, stats, testimonials, publishedPosts }) {
  const depth = 0;

  const carouselImages = page.hero.carouselImages
    .map(
      (item, index) =>
        `<img src="${resolveAsset(depth, item.image)}" alt="${escapeHtml(item.alt)}" class="hero-image carousel-image${index === 0 ? " active" : ""}">`
    )
    .join("\n                    ");

  const missionBannerText = `${page.missionBanner[0] || "NO STUDENT SHOULD STUDY HUNGRY"} • LEARN N' LUNCH •  • `;
  const bannerRepeats = Array.from({ length: 8 })
    .map(() => `<span class="banner-text-2">${escapeHtml(missionBannerText)}</span>`)
    .join("\n            ");

  const statsHtml = stats.items
    .map((stat) => {
      const label = String(stat.description).includes("<br>")
        ? stat.description
        : escapeHtml(stat.description);
      return `
              <div class="learn-lunch-stat">
                  <div class="learn-lunch-stat-number" data-target="${stat.target}">${escapeHtml(stat.valueLabel)}</div>
                  <div class="learn-lunch-stat-label">${label}</div>
              </div>`;
    })
    .join("\n");

  const modelCards = page.modelWorkCards
    .map(
      (card, index) => `
      <div class="card ${index === 0 ? "mission-card" : "vision-card"}">
        <div class="mm-tag" style="background:${card.accentColor};"></div>
        <h3>${escapeHtml(card.heading)}</h3>
        <p>${escapeHtml(card.body)}</p>
      </div>`
    )
    .join("\n");

  function renderFlowSteps(steps, arrowClass, arrowImage) {
    return steps
      .map((step) => {
        const arrow = `<span class="flow-arrow${arrowClass ? ` ${arrowClass}` : ""}">
                        <img src="${resolveAsset(depth, arrowImage)}" />
                    </span>`;
        return `${arrow}
                    <span class="flow-step">${escapeHtml(step)}</span>`;
      })
      .join("\n                    ");
  }

  function renderHowItWorksFlow(flow, variant) {
    const isDonors = variant === "donors";
    const arrowImage = isDonors ? "pixelated-arrow-yellow.svg" : "pixelated-arrow-white.svg";
    const arrowClass = isDonors ? "" : " white";
    const labelClass = isDonors ? "flow-label donors" : "flow-label";
    const cornerTl = isDonors ? "flow-label-corner-tl-d" : "flow-label-corner-tl";
    const cornerBr = isDonors ? "flow-label-corner-br-d" : "flow-label-corner-br";
    const ctaClass = isDonors ? "flow-cta donate" : "flow-cta";
    const ctaUrl = flow.ctaUrl.startsWith("http")
      ? flow.ctaUrl
      : resolveAsset(depth, flow.ctaUrl.replace(/^\//, ""));
    const ctaInner = isDonors
      ? `<span><img src="${resolveAsset(depth, "heart-yellow.svg")}" style="width: 14px;"></span> ${escapeHtml(flow.ctaLabel)}`
      : escapeHtml(flow.ctaLabel);

    return `
            <div class="flow-row">
                <div class="${labelClass}" role="button" tabindex="0" aria-label="Scroll to ${escapeHtml(flow.ctaLabel)}">
                    ${escapeHtml(flow.label)}
                    <span class="${cornerTl}"></span>
                    <span class="${cornerBr}"></span>
                </div>
                <div class="flow-steps">
                    ${renderFlowSteps(flow.steps, arrowClass, arrowImage)}
                    <span class="flow-arrow${arrowClass}">
                        <img src="${resolveAsset(depth, arrowImage)}" />
                    </span>
                    <a href="${escapeHtml(ctaUrl)}" class="${ctaClass}"${isDonors ? "" : ' target="_blank" rel="noopener noreferrer"'}>${ctaInner}</a>
                </div>
            </div>`;
  }

  const howItWorks = page.howItWorks;
  const howItWorksHtml = howItWorks
    ? `
<section class="how-it-works-section">
    <div class="how-it-works-container">
        <h2 class="how-it-works-title">
            ${escapeHtml(howItWorks.titleLine1)}<br>
            ${escapeHtml(howItWorks.titleLine2)}
        </h2>

        <div class="how-it-works-flows">
            ${renderHowItWorksFlow(howItWorks.studentsFlow, "students")}
            ${renderHowItWorksFlow(howItWorks.donorsFlow, "donors")}
        </div>
    </div>
</section>`
    : "";

  const photoClasses = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
  const photos = page.moments.photos
    .map(
      (photo, index) =>
        `<img src="${resolveAsset(depth, photo.image)}" alt="${escapeHtml(photo.alt)}" class="photo ${photoClasses[index] || "p1"}">`
    )
    .join("\n    ");

  const sloganRepeats = Array.from({ length: 8 })
    .map(() => `<span class="banner-text-2">${escapeHtml(page.moments.sloganText)}</span>`)
    .join("\n        ");

  const storyCards = publishedPosts
    .slice(0, 4)
    .map((post) => {
      const categorySlug = getPostCategorySlug(post);
      const tagColor = getPostTagColor(post);
      return `<article class="mm-card" data-category="${escapeHtml(categorySlug)}">
              <img src="${resolveAsset(depth, post.coverImage)}" alt="${escapeHtml(post.coverImageAlt || post.title)}" class="mm-img" loading="lazy">
              <span class="mm-tag mm-tag--${escapeHtml(categorySlug)}" style="background:${tagColor};"></span>
              <div class="mm-box">
                <p class="mm-head">${escapeHtml(post.title)}</p>
                <a href="${resolveAsset(depth, `stories/${post.slug}/`)}" class="mm-cta">Read more <span><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 18px; padding-top: 7px;"/></span></a>
              </div>
            </article>`;
    })
    .join("\n");

  const testimonialsHtml = testimonials
    .map(
      (item, index) => `
      <div class="mtm-testimonial-container${index === 0 ? "" : " mtm-hidden"}" data-testimonial="${index}">
        <div class="mtm-right-section">
          <div class="mtm-profile-image-container">
            <img src="${resolveAsset(depth, item.photo)}" alt="${escapeHtml(item.photoAlt || item.authorName)}" class="mtm-profile-image" />
          </div>
          <div class="mtm-right-body">
            <div class="mtm-navigation">
              <button class="mtm-nav-button mtm-prev-button" aria-label="Previous testimonial"><img src="${resolveAsset(depth, "pixelated-arrow-2.svg")}" style="width: 20px;"/></button>
              <button class="mtm-nav-button mtm-next-button" aria-label="Next testimonial"><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 20px;"/></button>
            </div>
            <div class="mtm-testimonial-content">
              <div class="mtm-quote">${escapeHtml(item.quote)}</div>
              <div class="mtm-author-info">
                <div class="mtm-author">${escapeHtml(item.authorName)},</div>
                <div class="mtm-affiliation">${escapeHtml(item.affiliation)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`
    )
    .join("\n");

  const body = `
    <section class="hero">
        <div class="hero-content">
          <div class="hero-image-container">
            <div class="image-frame">
                <div class="inner-frame">
                    ${carouselImages}
                    <div class="carousel-controls">
                        <button class="carousel-btn prev" aria-label="Previous slide">
                            <img src="${resolveAsset(depth, "pixelated-arrow-2.svg")}" style="width: 20px;"/>
                        </button>
                        <button class="carousel-btn next" aria-label="Next slide">
                            <img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 20px;"/>
                        </button>
                    </div>
                </div>
            </div>
          </div>

          <div class="hero-text">
            <h1>${escapeHtml(page.hero.heading)}</h1>
            <p>${escapeHtml(page.hero.body)}</p>
          </div>

          <div class="shapes-column">
            <div class="shape-group">
                <div class="square top"></div>
                <div class="square left"></div>
                <div class="square bottom"></div>
                <div class="square right"></div>
            </div>
            <div class="dashed-line-horizontal"></div>
            <div class="dashed-line-vertical"></div>
          </div>
        </div>
    </section>

    <div class="scrolling-banner-2">
        ${bannerRepeats}
    </div>

    <div class="scrolling-banner">
        ${bannerRepeats}
    </div>

    <section class="learn-lunch-section">
      <div class="learn-lunch-container">
          <div class="learn-lunch-content">
              <div class="learn-lunch-image-left">
                  <img src="${resolveAsset(depth, page.impactIntro.leftImage)}" alt="${escapeHtml(page.impactIntro.leftImageAlt)}">
              </div>

              <div class="learn-lunch-text">
                  <p>${escapeHtml(page.impactIntro.body)}</p>
                  <a href="${resolveAsset(depth, page.impactIntro.ctaUrl.replace(/^\//, ""))}" class="learn-lunch-cta">
                      <span><img src="${resolveAsset(depth, "heart-black.svg")}" style="width: 14px;"></span>
                      <span>${escapeHtml(page.impactIntro.ctaLabel)}</span>
                  </a>
              </div>

              <div class="learn-lunch-image-right">
                  <img src="${resolveAsset(depth, page.impactIntro.rightImage)}" alt="${escapeHtml(page.impactIntro.rightImageAlt)}">
              </div>
          </div>

          <div class="learn-lunch-stats">
              ${statsHtml}
          </div>
      </div>
    </section>

    <div class="mm-container">
      <h2 class="home-model-heading">HOW OUR MODEL WORKS</h2>
    </div>
    
    <section class="mission-vision-section" style="gap: 70px;">
      <div class="model-work"></div>
      ${modelCards}
    </section>

    ${howItWorksHtml}

    <section class="donate-cta-section">
    <div class="donate-cta-container">
        <div class="donate-cta-banner">
            <img src="${resolveAsset(depth, page.coalitionCta.backgroundImage)}" alt="${escapeHtml(page.coalitionCta.backgroundImageAlt)}" class="donate-cta-bg">
            <div class="donate-cta-overlay"></div>
            
            <div class="donate-cta-card">
                <div class="donate-cta-content">
                    <p class="donate-cta-title">
                      ${escapeHtml(page.coalitionCta.title)}
                    </p>
                    <a href="${escapeHtml(page.coalitionCta.buttonUrl)}" target="_blank" rel="noopener noreferrer" class="donate-cta-button">
                        <span>${escapeHtml(page.coalitionCta.buttonLabel)}</span>
                    </a>
                </div>
                
                <div class="donate-cta-qr">
                    <img src="${resolveAsset(depth, page.coalitionCta.qrImage)}" alt="${escapeHtml(page.coalitionCta.qrImageAlt)}">
                </div>
            </div>
        </div>
    </div>
</section>

<section class="moments-section">
  <div class="moments-heading-section">
    <h2 class="moments-heading">MOMENTS THAT<br>MATTER</h2>
  </div>

  <div class="moments-collage">
    ${photos}
    <div class="slogan">
        ${sloganRepeats}
    </div>
  </div>
</section>

<h2 class="bold-statement">
    “${escapeHtml(page.moments.statementQuote)}”
</h2>

<section class="mm-section mm-touch-carousel" data-carousel-id="home-stories">
    <div class="mm-container">
      <div class="mm-header">
        <div class="mm-title-col">
          <h2 class="mm-title">STORIES OF<br>CHANGE</h2>
        </div>
        <div class="mm-desc-col">
          <p class="mm-desc">${escapeHtml(page.storiesTeaser.description)}</p>
        </div>
      </div>

      <div class="mm-carousel-area">
        <div class="mm-nav">
          <button class="mm-nav-btn mm-prev-btn" data-carousel="home-stories" aria-label="Previous stories">
            <img src="${resolveAsset(depth, "pixelated-arrow-2.svg")}" style="width: 20px;"/>
          </button>
          <button class="mm-nav-btn mm-next-btn" data-carousel="home-stories" aria-label="Next stories">
            <img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 20px;"/>
          </button>
        </div>

        <div class="mm-carousel-viewport">
          <div class="mm-carousel-track" data-carousel-track="home-stories">
            ${storyCards}
          </div>
        </div>

        <div class="mm-more-wrap">
          <a href="${resolveAsset(depth, page.storiesTeaser.moreUrl.replace(/^\//, ""))}" class="mm-more">Check Out More <span><img src="${resolveAsset(depth, "pixelated-arrow.svg")}" style="width: 18px; padding-top: 7px;"/></span></a>
        </div>
      </div>
    </div>
  </section>

 <div id="app">
     <h3 class="mtm-title" >Moments That <br> Matter</h3>
      ${testimonialsHtml}
    </div>`;

  const headExtra = `
    <style>
      @media (max-width: 900px) { .nav-menu { background-color: #D3EEFF; }}
      @media (max-width: 1124px) {
        .mission-vision-section {
          flex-direction: column;
          gap: 60px;
          padding: 30px;
        }
      }
    </style>`;

  return renderPage({
    site,
    depth,
    title: site.defaultSeoTitle,
    description: site.defaultSeoDescription,
    activePath: "/",
    navbarStyle: "background-color: #D3EEFF;",
    bodyClass: "page-home",
    headExtra,
    footerCta: page.footerCta,
    body
  });
}

module.exports = { renderHome };
