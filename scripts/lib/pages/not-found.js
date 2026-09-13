const { resolveAsset, resolveHomeHref, defaultFooterCta } = require("../utils");
const { renderPage } = require("../partials");
const { buildOrganizationJsonLd } = require("../seo");

const MARQUEE_TEXT =
  "OFF THE MENU • PAGE NOT FOUND • LEARN N' LUNCH • NO STUDENT SHOULD STUDY HUNGRY • ";

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
    <p class="not-found__kicker">Today&rsquo;s list</p>
    <p class="not-found__miss">
      <span class="visually-hidden">Missing page </span>
      <span class="not-found__path" id="not-found-path">/that-page</span>
    </p>
    <div class="not-found__headline">
      <h1 class="not-found__title" id="not-found-title">Off the<br>menu</h1>
      <p class="not-found__code" aria-hidden="true">404</p>
    </div>
    <p class="not-found__lede">
      We checked the list twice. This page isn&rsquo;t serving today &mdash; but the movement still is.
    </p>
    <div class="not-found__actions">
      <a href="${homeHref}" class="not-found__cta not-found__cta--primary">
        <span>Home</span>
      </a>
      <a href="${involvedHref}" class="not-found__cta not-found__cta--secondary">
        <span>Get Involved</span>
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
<script>
(function () {
  var el = document.getElementById("not-found-path");
  if (!el) return;
  var path = window.location.pathname || "";
  if (!path || path === "/" || path === "/404" || path === "/404.html" || path === "/404/") return;
  var text = path + (window.location.search || "");
  text = text.replace(/[\\u0000-\\u001F\\u007F]/g, "");
  if (text.length > 80) text = text.slice(0, 77) + "\\u2026";
  el.textContent = text;
})();
</script>`;

  return renderPage({
    site,
    depth,
    title: "Page Not Found | Learn And Lunch",
    description:
      "This page is off the menu. Head home or get involved with the campus hunger movement in Uganda.",
    canonicalPath: "/",
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
