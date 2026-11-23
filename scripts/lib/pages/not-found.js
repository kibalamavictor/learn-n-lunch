const { resolveAsset, resolveHomeHref, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { buildOrganizationJsonLd } = require("../seo");

const MARQUEE_TEXT =
  "LEARN AND LUNCH · BUILDING FOOD-SECURE UNIVERSITIES · NO STUDENT SHOULD HAVE TO STUDY HUNGRY · ";

function renderNotFound({ site }) {
  // GitHub Pages serves 404.html for missing URLs while keeping the broken path
  // in the address bar, so all assets must be root-absolute.
  const depth = "absolute";
  const homeHref = resolveHomeHref(depth);
  const involvedHref = resolveAsset(depth, "get-involved/");
  const bannerSpans = Array.from({ length: 8 }, () => `<span class="banner-text-2">${MARQUEE_TEXT}</span>`).join("\n  ");

  const body = `
<section class="not-found" aria-labelledby="not-found-title">
  <div class="not-found__stack">
    <p class="not-found__kicker">PAGE NOT FOUND</p>
    <p class="not-found__miss">
      The page you are looking for may have moved or is no longer available.
    </p>
    <div class="not-found__headline">
      <h1 class="not-found__title" id="not-found-title">This page isn't available</h1>
      <p class="not-found__code" aria-hidden="true">404</p>
    </div>
    <p class="not-found__lede">
      We couldn't find the page you requested. You can return to the homepage or explore our work towards food-secure universities.
    </p>
    <div class="not-found__actions">
      <a href="${homeHref}" class="not-found__cta not-found__cta--primary">
        <span>Home</span>
      </a>
      <a href="${involvedHref}" class="not-found__cta not-found__cta--secondary">
        <span>Explore Our Work</span>
      </a>
    </div>
  </div>
</section>

<div class="not-found__marquees" aria-hidden="true">
  <div class="scrolling-banner-2">
  ${bannerSpans}
  </div>
  <div class="scrolling-banner">
  ${bannerSpans}
  </div>
</div>
`;

  return renderPage({
    site,
    depth,
    title: "Page Not Found | Learn And Lunch",
    description:
      "The page you requested could not be found. Visit Learn And Lunch to explore our work on campus food security in Uganda.",
    canonicalPath: "/",
    ogImage: "/assets/uploads/learn_and_lunch_08.webp",
    ogImageAlt: "Students gathered outdoors with Learn And Lunch",
    robots: "noindex, follow",
    bodyClass: "page-not-found",
    navbarStyle: "background-color: #D3EEFF;",
    body,
    footerCta: defaultFooterCta(depth),
    structuredData: [buildOrganizationJsonLd(site)]
  });
}

module.exports = { renderNotFound };
