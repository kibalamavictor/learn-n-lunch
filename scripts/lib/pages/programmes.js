const {
  escapeHtml,
  resolveAsset,
  markdownToHtml,
  resolveMarkdownPaths,
  defaultFooterCta
} = require("../utils");
const { renderPage } = require("../partials");
const { renderStoryCarousel } = require("../carousel");
const {
  resolvePageSeo,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

const ACTIVITY_COLORS = {
  understand: "#d3eeff",
  mobilise: "#fdc039",
  build: "#7be4d3",
  partner: "#bce2f4",
  convene: "#61cdbb"
};

function activityLabel(page, key) {
  const pathway = (page.theoryOfChange?.pathways || []).find((item) => item.key === key);
  return pathway?.activity || key;
}

function resolveLink(depth, url) {
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/.test(url)) return url;
  return resolveAsset(depth, url.replace(/^\//, ""));
}

function programmeUrl(depth, programme) {
  return resolveAsset(depth, `programmes/${programme.slug}/`);
}

function renderToc(page, programmes, depth) {
  const toc = page.theoryOfChange;
  if (!toc?.pathways?.length) return "";

  const columns = [
    { key: "activity", label: "Activities", hint: "What we do" },
    { key: "output", label: "Outputs", hint: "What we produce" },
    { key: "outcome", label: "Outcomes", hint: "What changes" },
    { key: "goal", label: "Goals", hint: "Our focus areas" }
  ];

  const rows = toc.pathways
    .map((pathway) => {
      const linked = programmes.filter((programme) => programme.activity === pathway.key);
      const chips = linked.length
        ? `<ul class="prog-toc__chips">${linked
            .map(
              (programme) =>
                `<li><a class="prog-toc__chip" href="${
                  programme.hasPage ? programmeUrl(depth, programme) : `#${escapeHtml(programme.slug)}`
                }">${escapeHtml(programme.title)}</a></li>`
            )
            .join("")}</ul>`
        : pathway.chipsNote
          ? `<p class="prog-toc__chip prog-toc__chip--static">${escapeHtml(pathway.chipsNote)}</p>`
          : "";

      const cells = columns
        .map(
          (column) => `
        <div class="prog-toc__cell prog-toc__cell--${column.key}">
          <p class="prog-toc__label">${escapeHtml(column.label)}</p>
          <h3 class="prog-toc__cell-title">${escapeHtml(pathway[column.key])}</h3>
          <p>${escapeHtml(pathway[`${column.key}Body`])}</p>
          ${column.key === "activity" ? chips : ""}
        </div>`
        )
        .join("");

      return `
      <article class="prog-toc__row prog-toc__row--${escapeHtml(pathway.key)}" aria-label="${escapeHtml(pathway.activity)} pathway">${cells}
      </article>`;
    })
    .join("");

  const heads = columns
    .map(
      (column) => `
        <div class="prog-toc__head prog-toc__head--${column.key}">
          <span>${escapeHtml(column.label)}</span>
          <small>${escapeHtml(column.hint)}</small>
        </div>`
    )
    .join("");

  const goal = toc.strategicGoal || {};
  const download = toc.file
    ? `<a class="learn-lunch-cta lnl-cta--yellow prog-toc__download" href="${resolveLink(depth, toc.file)}" download><span>${escapeHtml(
        toc.fileLabel || "Download the Theory of Change"
      )}</span></a>`
    : "";

  return `
<section class="prog-toc" id="theory-of-change" aria-labelledby="prog-toc-title">
  <div class="prog-wrap">
    <header class="prog-toc__header">
      <h2 class="prog-toc__title" id="prog-toc-title">${escapeHtml(toc.heading || "Theory of Change")}</h2>
      ${toc.subheading ? `<p class="prog-toc__subtitle">${escapeHtml(toc.subheading)}</p>` : ""}
      ${toc.statement ? `<p class="prog-toc__statement">${escapeHtml(toc.statement)}</p>` : ""}
    </header>

    <div class="prog-toc__layout">
      <div class="prog-toc__grid">
        <div class="prog-toc__heads" aria-hidden="true">${heads}
        </div>${rows}
      </div>

      <aside class="prog-toc__goal" aria-label="Strategic goal">
        <p class="prog-toc__goal-label">Strategic goal</p>
        <h3>${escapeHtml(goal.title || "")}</h3>
        <p>${escapeHtml(goal.body || "")}</p>
      </aside>
    </div>

    <div class="prog-toc__footer">
      ${download}
      <a class="prog-toc__impact-link" href="${resolveAsset(depth, "impact/")}">See our impact so far <span aria-hidden="true">→</span></a>
    </div>
  </div>
</section>`;
}

function renderProgrammeCards(page, programmes, depth) {
  const cards = programmes
    .map((programme) => {
      let link = "";
      if (programme.hasPage) {
        link = `<a class="prog-card__link" href="${programmeUrl(depth, programme)}">Explore the programme<span class="visually-hidden">: ${escapeHtml(
          programme.title
        )}</span> <span aria-hidden="true">→</span></a>`;
      } else if (programme.linkUrl) {
        link = `<a class="prog-card__link" href="${escapeHtml(resolveLink(depth, programme.linkUrl))}">${escapeHtml(
          programme.linkLabel || "Learn more"
        )} <span aria-hidden="true">→</span></a>`;
      }

      return `
      <article class="prog-card" id="${escapeHtml(programme.slug)}">
        <span class="prog-card__activity" style="background:${ACTIVITY_COLORS[programme.activity] || "#d3eeff"};">${escapeHtml(
          activityLabel(page, programme.activity)
        )}</span>
        <h3 class="prog-card__title">${escapeHtml(programme.title)}</h3>
        <p class="prog-card__summary">${escapeHtml(programme.summary)}</p>
        ${programme.status ? `<p class="prog-card__status">${escapeHtml(programme.status)}</p>` : ""}
        ${link}
      </article>`;
    })
    .join("");

  return `
<section class="prog-list" id="programmes" aria-labelledby="prog-list-title">
  <div class="prog-wrap">
    <h2 class="prog-section-title" id="prog-list-title">${escapeHtml(page.programmesHeading || "Our programmes")}</h2>
    ${page.programmesIntro ? `<p class="prog-section-intro">${escapeHtml(page.programmesIntro)}</p>` : ""}
    <div class="prog-cards">${cards}
    </div>
  </div>
</section>`;
}

function renderProgrammes({ site, page, programmes }) {
  const depth = 1;
  const problem = page.problem || {};

  const body = `
<div class="lnl-hero-container lnl-hero-container--full">
  <div class="lnl-hero-content">
    <h1>${escapeHtml(page.heading)}</h1>
    <p>${escapeHtml(page.intro)}</p>
  </div>
</div>

${
  problem.statement
    ? `<section class="prog-problem" aria-labelledby="prog-problem-title">
  <div class="prog-wrap">
    <p class="prog-eyebrow" id="prog-problem-title">${escapeHtml(problem.heading || "Why we exist")}</p>
    <p class="prog-problem__statement">${escapeHtml(problem.statement)}</p>
    ${problem.body ? `<p class="prog-problem__body">${escapeHtml(problem.body)}</p>` : ""}
  </div>
</section>`
    : ""
}

${renderToc(page, programmes, depth)}

${renderProgrammeCards(page, programmes, depth)}`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/programmes/",
    defaults: {
      title: `${page.title} | ${site.siteName}`,
      description: page.intro,
      keywords: "campus hunger programmes Uganda, theory of change, student food security, nutrition education"
    }
  });

  return renderPage({
    site,
    depth,
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    ogImage: seo.ogImage,
    ogImageAlt: seo.ogImageAlt,
    keywords: seo.keywords,
    ogType: seo.ogType,
    structuredData: [
      buildOrganizationJsonLd(site),
      buildBreadcrumbJsonLd(site, [
        { name: "Home", path: "/" },
        { name: "Programmes", path: "/programmes/" }
      ])
    ],
    activePath: "/programmes",
    footerCta: defaultFooterCta(depth),
    body
  });
}

function renderProgramme({ site, page, programme, relatedPosts = [] }) {
  const depth = 2;
  const canonicalPath = `/programmes/${programme.slug}/`;
  const label = activityLabel(page, programme.activity);

  const cover = programme.coverImage
    ? `
    <figure class="exam-story-image-wrapper prog-cover">
      <img src="${resolveAsset(depth, programme.coverImage)}" alt="${escapeHtml(
        programme.coverImageAlt || programme.title
      )}" class="exam-story-hero-image" />
      ${
        programme.coverImageCredit
          ? `<figcaption class="story-photo-credit">${escapeHtml(programme.coverImageCredit)}</figcaption>`
          : ""
      }
    </figure>`
    : "";

  const facts = (programme.facts || []).length
    ? `
    <dl class="prog-facts">${programme.facts
      .map(
        (fact) => `
      <div class="prog-fact">
        <dt>${escapeHtml(fact.label)}</dt>
        <dd>${escapeHtml(fact.value)}</dd>
      </div>`
      )
      .join("")}
    </dl>`
    : "";

  const steps = (programme.steps || []).length
    ? `
    <section class="prog-steps" aria-labelledby="prog-steps-title">
      <h2 class="sub-heading" id="prog-steps-title">${escapeHtml(programme.stepsHeading || "How it works")}</h2>
      <ol class="prog-steps__list">${programme.steps
        .map(
          (step, index) => `
        <li class="prog-step">
          <span class="prog-step__num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.body)}</p>
        </li>`
        )
        .join("")}
      </ol>
    </section>`
    : "";

  const partners = (programme.partners || []).length
    ? `
    <section class="prog-partners" aria-labelledby="prog-partners-title">
      <h2 class="sub-heading" id="prog-partners-title">In partnership with</h2>
      <ul class="prog-partners__list">${programme.partners
        .map((partner) => {
          const inner = partner.logo
            ? `<img src="${resolveAsset(depth, partner.logo)}" alt="${escapeHtml(partner.name)} logo" loading="lazy" /><span>${escapeHtml(
                partner.name
              )}</span>`
            : `<span>${escapeHtml(partner.name)}</span>`;
          return `<li>${
            partner.url
              ? `<a class="prog-partner" href="${escapeHtml(partner.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
              : `<div class="prog-partner">${inner}</div>`
          }</li>`;
        })
        .join("")}
      </ul>
    </section>`
    : "";

  const cta = programme.cta?.heading
    ? `
    <section class="prog-cta" aria-labelledby="prog-cta-title">
      <h2 id="prog-cta-title">${escapeHtml(programme.cta.heading)}</h2>
      ${programme.cta.body ? `<p>${escapeHtml(programme.cta.body)}</p>` : ""}
      <div class="prog-cta__actions">
        ${
          programme.cta.primaryUrl
            ? `<a class="learn-lunch-cta lnl-cta--yellow" href="${escapeHtml(resolveLink(depth, programme.cta.primaryUrl))}"><span>${escapeHtml(
                programme.cta.primaryLabel
              )}</span></a>`
            : ""
        }
        ${
          programme.cta.secondaryUrl
            ? `<a class="learn-lunch-cta lnl-cta--blue" href="${escapeHtml(resolveLink(depth, programme.cta.secondaryUrl))}"><span>${escapeHtml(
                programme.cta.secondaryLabel
              )}</span></a>`
            : ""
        }
      </div>
    </section>`
    : "";

  const related = relatedPosts.length
    ? `
<div class="donor-highlight-container stories-article" data-category="all" style="max-width: 1140px; margin: 0 auto; padding: 1.5rem 0 0;">
  <p class="stories-recents-title">STORIES FROM<br> THIS PROGRAMME</p>
</div>
${renderStoryCarousel({
  depth,
  posts: relatedPosts,
  carouselId: "programme-stories",
  sectionClass: "stories-article",
  sectionStyle: "background: white; padding: 56px 20px 20px; max-width: 1140px; margin: 0 auto;"
})}`
    : "";

  const body = `
<div class="exam-story-container prog-detail">
  <div class="exam-story-header">
    <a href="${resolveAsset(depth, "programmes/")}" aria-label="Back to all programmes">
      <span class="back-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </span>
    </a>
    <a class="category-badge prog-detail__badge" href="${resolveAsset(depth, "programmes/")}#theory-of-change" style="background:${
      ACTIVITY_COLORS[programme.activity] || "#d3eeff"
    };">${escapeHtml(label)}</a>
  </div>

  <header class="prog-hero">
    <h1 class="exam-story-title">${escapeHtml(programme.title).toUpperCase()}</h1>
    ${programme.tagline ? `<p class="prog-hero__tagline">${escapeHtml(programme.tagline)}</p>` : ""}
    ${programme.status ? `<p class="prog-card__status">${escapeHtml(programme.status)}</p>` : ""}
  </header>
  ${cover}
  ${facts}
  ${steps}

  ${
    programme.body
      ? `<div class="blog-content prog-body">
    ${resolveMarkdownPaths(markdownToHtml(programme.body), depth)}
  </div>`
      : ""
  }
  ${partners}
  ${cta}
</div>
${related}`;

  const seo = resolvePageSeo({
    site,
    page: programme,
    canonicalPath,
    defaults: {
      title: `${programme.title} | ${site.siteName}`,
      description: programme.tagline || programme.summary,
      keywords: `${programme.title}, Learn And Lunch, campus hunger Uganda`
    }
  });

  return renderPage({
    site,
    depth,
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    ogImage: seo.ogImage,
    ogImageAlt: seo.ogImageAlt,
    keywords: seo.keywords,
    ogType: seo.ogType,
    structuredData: [
      buildOrganizationJsonLd(site),
      buildBreadcrumbJsonLd(site, [
        { name: "Home", path: "/" },
        { name: "Programmes", path: "/programmes/" },
        { name: programme.title, path: canonicalPath }
      ])
    ],
    activePath: "/programmes",
    footerCta: defaultFooterCta(depth),
    body
  });
}

module.exports = { renderProgrammes, renderProgramme };
