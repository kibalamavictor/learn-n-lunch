#!/usr/bin/env node
// Render CMS content in content/ to static HTML; synced to main after deploy.
const path = require("path");
const { loadAllContent } = require("./lib/load-content");
const { writeFileEnsured, getRelatedPosts } = require("./lib/utils");
const { buildSitemapEntries, renderSitemapXml, getSiteUrl } = require("./lib/seo");
const { renderHome } = require("./lib/pages/home");
const { renderAbout } = require("./lib/pages/about");
const { renderImpact } = require("./lib/pages/impact");
const { renderStories } = require("./lib/pages/stories");
const { renderDonate } = require("./lib/pages/donate");
const { renderContact, renderGetInvolved } = require("./lib/pages/contact");
const { renderBlogPost } = require("./lib/pages/blog-post");

const ROOT = process.cwd();

function build() {
  const content = loadAllContent();
  const { site, pages, stats, team, testimonials, publishedBlogPosts } = content;
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

  publishedBlogPosts.forEach((post) => {
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

  writePage(
    "students/index.html",
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=../stories/how-one-meal-changed-my-exam-week/" />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${getSiteUrl(site)}/stories/how-one-meal-changed-my-exam-week/" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>This story has moved. <a href="../stories/how-one-meal-changed-my-exam-week/">Continue to the story</a>.</p>
  </body>
</html>`
  );

  const sitemapEntries = buildSitemapEntries({ site, publishedBlogPosts });
  writeFileEnsured(path.join(ROOT, "sitemap.xml"), renderSitemapXml(sitemapEntries));

  console.log("Site build complete.");
  console.log(`- Pages rendered: ${pagesRendered - publishedBlogPosts.length}`);
  console.log(`- Blog posts rendered: ${publishedBlogPosts.length}`);
}

build();
