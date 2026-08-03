const path = require("path");
const { readJson, readMarkdown, listMarkdownFiles, normalizePostSlug } = require("./utils");

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

function loadSiteSettings() {
  return readJson(path.join(CONTENT, "settings/site.json"));
}

function loadPage(slug) {
  return readMarkdown(path.join(CONTENT, "pages", `${slug}.md`)).data;
}

function loadStats(name) {
  return readJson(path.join(CONTENT, "stats", `${name}.json`));
}

function loadCollection(folder) {
  return listMarkdownFiles(path.join(CONTENT, folder))
    .map((filePath) => {
      const { data, body } = readMarkdown(filePath);
      return { ...data, body, filePath };
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function loadBlogPosts() {
  const blog = loadCollection("blog").map((post) => ({
    ...post,
    slug: normalizePostSlug(post.slug)
  }));
  const reports = loadCollection("reports").map((post) => ({
    ...post,
    slug: normalizePostSlug(post.slug),
    tags: post.tags?.length ? post.tags : ["Impact Reports"]
  }));

  return [...blog, ...reports].sort((a, b) => {
    const aDate = new Date(a.publishedAt || 0).getTime();
    const bDate = new Date(b.publishedAt || 0).getTime();
    return bDate - aDate;
  });
}

function loadPublishedBlogPosts() {
  return loadBlogPosts().filter((post) => post.status === "published");
}

function loadAllContent() {
  return {
    site: loadSiteSettings(),
    pages: {
      home: loadPage("home"),
      about: loadPage("about-us"),
      impact: loadPage("impact"),
      stories: loadPage("stories"),
      donate: loadPage("donate"),
      contact: loadPage("contact-us"),
      getInvolved: loadPage("get-involved")
    },
    stats: {
      home: loadStats("home"),
      impact: loadStats("impact"),
      impactMap: loadStats("impact-map")
    },
    team: loadCollection("team").filter((member) => member.isActive !== false),
    testimonials: loadCollection("testimonials").filter((item) => item.isActive !== false),
    blogPosts: loadBlogPosts(),
    publishedBlogPosts: loadPublishedBlogPosts()
  };
}

module.exports = { loadAllContent };
