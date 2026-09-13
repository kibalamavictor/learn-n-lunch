const { resolveAsset, resolveHomeHref, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { buildOrganizationJsonLd } = require("../seo");

function renderNotFound({ site }) {
  // GitHub Pages serves 404.html for missing URLs while keeping the broken path
  // in the address bar, so all assets must be root-absolute.
  const depth = "absolute";
  const homeHref = resolveHomeHref(depth);
  const storiesHref = resolveAsset(depth, "stories/");
  const heroImage = resolveAsset(depth, "assets/uploads/learn_and_lunch_08.webp", {
    cloudinaryWidth: 1600
  });

  const body = `
<section class="not-found" aria-labelledby="not-found-brand">
  <div class="not-found__media" aria-hidden="true">
    <img
      src="${heroImage}"
      alt=""
      class="not-found__bg"
      width="1600"
      height="1066"
      decoding="async"
      fetchpriority="high"
    >
    <div class="not-found__shade"></div>
  </div>

  <div class="not-found__content">
    <p class="not-found__brand" id="not-found-brand">Learn N' Lunch</p>
    <p class="not-found__code" aria-hidden="true">404</p>
    <h1 class="not-found__title">This plate came up empty</h1>
    <p class="not-found__lede">
      The page you were looking for is not on the menu. Head home, or dig into
      stories from the campuses where we are ending hunger.
    </p>
    <div class="not-found__actions">
      <a href="${homeHref}" class="not-found__cta not-found__cta--primary">
        <span>Back Home</span>
      </a>
      <a href="${storiesHref}" class="not-found__cta not-found__cta--secondary">
        <span>Read Stories</span>
      </a>
    </div>
  </div>
</section>

<div class="scrolling-banner-2 not-found-banner">
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
</div>

<div class="scrolling-banner not-found-banner">
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
  <span class="banner-text-2">PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • </span>
</div>`;

  return renderPage({
    site,
    depth,
    title: "Page Not Found | Learn And Lunch",
    description:
      "This Learn And Lunch page could not be found. Return home or explore stories from the campus hunger movement in Uganda.",
    canonicalPath: "/404.html",
    ogImage: "/assets/uploads/learn_and_lunch_08.webp",
    ogImageAlt: "Students gathered outdoors with Learn N' Lunch",
    robots: "noindex, follow",
    bodyClass: "page-not-found",
    navbarStyle: "background-color: #D3EEFF;",
    body,
    footerCta: defaultFooterCta(depth),
    structuredData: [buildOrganizationJsonLd(site)]
  });
}

module.exports = { renderNotFound };
