#!/usr/bin/env node
// Render CMS content in content/ to static HTML; synced to main after deploy.
const fs = require("fs");
const path = require("path");
const { loadAllContent } = require("./lib/load-content");
const { writeFileEnsured, getRelatedPosts, getPostSourceUrl } = require("./lib/utils");
const { buildSitemapEntries, renderSitemapXml, getSiteUrl } = require("./lib/seo");
const { renderHome } = require("./lib/pages/home");
const { renderAbout } = require("./lib/pages/about");
const { renderImpact } = require("./lib/pages/impact");
const { renderStories } = require("./lib/pages/stories");
const { renderDonate } = require("./lib/pages/donate");
const { renderContact, renderGetInvolved } = require("./lib/pages/contact");
const { renderClosedPage } = require("./lib/pages/closed");
const { renderBirthdayCard } = require("./lib/pages/birthday-card");
const { renderNotFound } = require("./lib/pages/not-found");
const { renderBlogPost } = require("./lib/pages/blog-post");
const { renderProgrammes, renderProgramme } = require("./lib/pages/programmes");
const { renderResearchDashboard } = require("./lib/pages/research-dashboard");
const { renderStudyAppsScript } = require("./lib/research/apps-script");
const { study: kiuFoodStudy } = require("./lib/research/kiu-food-study");

const ROOT = process.cwd();

async function build() {
  const content = loadAllContent();
  const { site, pages, stats, team, testimonials, programmes, publishedBlogPosts } = content;
  await require("./lib/news-preview").populateNewsImages(publishedBlogPosts);
  const programmesWithPages = programmes.filter((programme) => programme.hasPage);
  let pagesRendered = 0;

  function writePage(relativeOutputPath, html) {
    writeFileEnsured(path.join(ROOT, relativeOutputPath), html);
    pagesRendered += 1;
  }

  writePage(
    "index.html",
    renderHome({
      site,
      page: pages.home,
      stats: stats.home,
      testimonials,
      publishedPosts: publishedBlogPosts
    })
  );

  writePage(
    "about-us/index.html",
    renderAbout({
      site,
      page: pages.about,
      team
    })
  );

  writePage(
    "impact/index.html",
    renderImpact({
      site,
      page: pages.impact,
      stats: stats.impact,
      impactMap: stats.impactMap,
      publishedPosts: publishedBlogPosts
    })
  );

  writePage(
    "programmes/index.html",
    renderProgrammes({
      site,
      page: pages.programmes,
      programmes
    })
  );

  const programmesDir = path.join(ROOT, "programmes");
  const liveProgrammeSlugs = new Set(programmesWithPages.map((programme) => programme.slug));
  if (fs.existsSync(programmesDir)) {
    fs.readdirSync(programmesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !liveProgrammeSlugs.has(entry.name))
      .forEach((entry) => fs.rmSync(path.join(programmesDir, entry.name), { recursive: true, force: true }));
  }

  programmesWithPages.forEach((programme) => {
    writePage(
      `programmes/${programme.slug}/index.html`,
      renderProgramme({
        site,
        page: pages.programmes,
        programme,
        relatedPosts: publishedBlogPosts.filter((post) => post.programme === programme.slug)
      })
    );
  });

  writePage(
    "stories/index.html",
    renderStories({
      site,
      page: pages.stories,
      publishedPosts: publishedBlogPosts
    })
  );

  writePage(
    "donate/index.html",
    renderDonate({
      site,
      page: pages.donate
    })
  );

  writePage("donations/index.html", renderDonate({ site, page: pages.donate }));

  writePage(
    "contact-us/index.html",
    renderContact({
      site,
      page: pages.contact
    })
  );

  writePage(
    "get-involved/index.html",
    renderGetInvolved({
      site,
      page: pages.getInvolved
    })
  );

  writePage(
    "summit/index.html",
    renderClosedPage({
      site,
      depth: 1,
      canonicalPath: "/summit/",
      kicker: "Campus Food Security Summit 2026",
      title: `Summit closed | ${site.siteName}`,
      heading: "Registration is closed",
      description: "The Campus Food Security Summit 2026 has taken place. Registration and the mobilisation poster are closed.",
      body: "<p>The Campus Food Security Summit 2026 has taken place. Thank you to the students, universities and partners who were in the room.</p>",
      action: {
        label: "Read the summit story",
        href: "stories/first-campus-food-security-summit-2026/"
      }
    })
  );

  const summitRedirect = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=../summit/" />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${getSiteUrl(site)}/summit/" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>Registration is closed. <a href="../summit/">Continue</a>.</p>
  </body>
</html>`;

  writePage("ill-be-there/index.html", summitRedirect);
  writePage("summit-poster/index.html", summitRedirect);

  writePage(
    "kiu-food-study/index.html",
    renderClosedPage({
      site,
      depth: 1,
      canonicalPath: "/kiu-food-study/",
      kicker: "Research questionnaire",
      title: `Questionnaire closed | ${site.siteName}`,
      heading: "This questionnaire is closed",
      description: "The KIU student food insecurity questionnaire is no longer accepting responses.",
      body: "<p>The student food insecurity questionnaire at Kampala International University is no longer accepting responses. Thank you to every student who took part.</p>"
    })
  );
  writePage(
    "kiu-food-study/dashboard/index.html",
    renderResearchDashboard({
      site,
      page: pages.kiuFoodStudy,
      study: kiuFoodStudy,
      canonicalPath: "/kiu-food-study/dashboard/",
      formPath: "/kiu-food-study/"
    })
  );
  writeFileEnsured(path.join(ROOT, "scripts/kiu-food-study.gs"), renderStudyAppsScript(kiuFoodStudy));

  writePage(
    "birthday-card/index.html",
    renderBirthdayCard({
      site,
      page: pages.birthdayCard
    })
  );

  publishedBlogPosts.filter((post) => !getPostSourceUrl(post)).forEach((post) => {
    const relatedPosts = getRelatedPosts(post, publishedBlogPosts);

    writePage(
      `stories/${post.slug}/index.html`,
      renderBlogPost({
        site,
        post,
        relatedPosts
      })
    );
  });

  writePage("404.html", renderNotFound({ site }));

  writePage(
    "students/index.html",
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=../stories/" />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${getSiteUrl(site)}/stories/" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>This page has moved. <a href="../stories/">Continue to our stories</a>.</p>
  </body>
</html>`
  );

  const sitemapEntries = buildSitemapEntries({ site, publishedBlogPosts, programmesWithPages });
  writeFileEnsured(path.join(ROOT, "sitemap.xml"), renderSitemapXml(sitemapEntries));

  console.log("Site build complete.");
  console.log(`- Pages rendered: ${pagesRendered - publishedBlogPosts.length}`);
  console.log(`- Blog posts rendered: ${publishedBlogPosts.length}`);
}

build().catch((error) => { console.error(error); process.exitCode = 1; });
