#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = process.cwd();
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`[invalid-json] ${filePath}: ${error.message}`);
    return null;
  }
}

function readMarkdownData(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return matter(raw).data || {};
  } catch (error) {
    errors.push(`[invalid-markdown] ${filePath}: ${error.message}`);
    return {};
  }
}

function listFiles(dirPath, extension) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(extension))
    .map((file) => path.join(dirPath, file));
}

function validateRequired(value, label, filePath) {
  const ok =
    value !== undefined &&
    value !== null &&
    !(typeof value === "string" && value.trim() === "") &&
    !(Array.isArray(value) && value.length === 0);
  assert(ok, `[required] ${filePath}: ${label} is missing`);
}

function validatePage(fileName, checks) {
  const pagePath = path.join(ROOT, "content/pages", fileName);
  assert(fs.existsSync(pagePath), `[missing-file] ${pagePath}`);
  if (!fs.existsSync(pagePath)) return;
  const data = readMarkdownData(pagePath);
  checks.forEach(({ key, label }) => validateRequired(data[key], label, pagePath));
}

function validate() {
  const sitePath = path.join(ROOT, "content/settings/site.json");
  const site = readJson(sitePath);
  if (site) {
    validateRequired(site.siteName, "siteName", sitePath);
    validateRequired(site.siteUrl, "siteUrl", sitePath);
    validateRequired(site.navigation, "navigation", sitePath);
    validateRequired(site.socialLinks, "socialLinks", sitePath);
  }

  validatePage("home.md", [
    { key: "hero", label: "hero" },
    { key: "impactIntro", label: "impactIntro" },
    { key: "modelWorkCards", label: "modelWorkCards" },
    { key: "coalitionCta", label: "coalitionCta" },
    { key: "moments", label: "moments" },
    { key: "storiesTeaser", label: "storiesTeaser" },
    { key: "partners", label: "partners" },
    { key: "footerCta", label: "footerCta" }
  ]);

  validatePage("about-us.md", [
    { key: "hero", label: "hero" },
    { key: "missionVision", label: "missionVision" },
    { key: "values", label: "values" },
    { key: "challenge", label: "challenge" }
  ]);

  validatePage("impact.md", [
    { key: "hero", label: "hero" },
    { key: "numbersHeading", label: "numbersHeading" },
    { key: "faces", label: "faces" },
    { key: "scrollBanner", label: "scrollBanner" },
    { key: "strategicFramework", label: "strategicFramework" },
    { key: "impactReport", label: "impactReport" },
    { key: "footerCta", label: "footerCta" }
  ]);

  validatePage("stories.md", [
    { key: "hero", label: "hero" },
    { key: "filters", label: "filters" },
    { key: "featuredSections", label: "featuredSections" }
  ]);

  validatePage("donate.md", [
    { key: "heading", label: "heading" },
    { key: "amountPresets", label: "amountPresets" },
    { key: "frequencyOptions", label: "frequencyOptions" },
    { key: "fieldLabels", label: "fieldLabels" }
  ]);

  validatePage("get-involved.md", [
    { key: "heading", label: "heading" },
    { key: "intro", label: "intro" },
    { key: "opportunities", label: "opportunities" }
  ]);

  validatePage("contact-us.md", [
    { key: "heading", label: "heading" },
    { key: "intro", label: "intro" },
    { key: "email", label: "email" }
  ]);

  const homeStatsPath = path.join(ROOT, "content/stats/home.json");
  const impactStatsPath = path.join(ROOT, "content/stats/impact.json");
  const homeStats = readJson(homeStatsPath);
  const impactStats = readJson(impactStatsPath);

  if (homeStats) {
    validateRequired(homeStats.items, "items", homeStatsPath);
    homeStats.items.forEach((item, index) => {
      validateRequired(item.target, `items[${index}].target`, homeStatsPath);
      validateRequired(item.description, `items[${index}].description`, homeStatsPath);
    });
  }

  if (impactStats) {
    validateRequired(impactStats.items, "items", impactStatsPath);
    impactStats.items.forEach((item, index) => {
      validateRequired(item.target, `items[${index}].target`, impactStatsPath);
      validateRequired(item.primaryLabel, `items[${index}].primaryLabel`, impactStatsPath);
      validateRequired(item.secondaryLabel, `items[${index}].secondaryLabel`, impactStatsPath);
    });
  }

  const impactMapPath = path.join(ROOT, "content/stats/impact-map.json");
  const impactMap = readJson(impactMapPath);
  if (impactMap) {
    validateRequired(impactMap.campuses, "campuses", impactMapPath);
    impactMap.campuses.forEach((campus, index) => {
      validateRequired(campus.id, `campuses[${index}].id`, impactMapPath);
      validateRequired(campus.name, `campuses[${index}].name`, impactMapPath);
      validateRequired(campus.x, `campuses[${index}].x`, impactMapPath);
      validateRequired(campus.y, `campuses[${index}].y`, impactMapPath);
    });
  }

  const teamFiles = listFiles(path.join(ROOT, "content/team"), ".md");
  assert(teamFiles.length > 0, "[required] content/team: add at least one team entry");
  for (const filePath of teamFiles) {
    const data = readMarkdownData(filePath);
    validateRequired(data.name, "name", filePath);
    validateRequired(data.role, "role", filePath);
    validateRequired(data.photo, "photo", filePath);
  }

  const testimonialFiles = listFiles(path.join(ROOT, "content/testimonials"), ".md");
  assert(
    testimonialFiles.length > 0,
    "[required] content/testimonials: add at least one testimonial entry"
  );
  for (const filePath of testimonialFiles) {
    const data = readMarkdownData(filePath);
    validateRequired(data.quote, "quote", filePath);
    validateRequired(data.authorName, "authorName", filePath);
    validateRequired(data.photo, "photo", filePath);
  }

  const blogFiles = listFiles(path.join(ROOT, "content/blog"), ".md");
  for (const filePath of blogFiles) {
    const data = readMarkdownData(filePath);
    validateRequired(data.title, "title", filePath);
    validateRequired(data.slug, "slug", filePath);
    assert(
      typeof data.slug === "string" &&
        !String(data.slug).includes("/") &&
        !String(data.slug).startsWith(" "),
      `[invalid] ${filePath}: slug must be a plain path segment (no slashes). Got "${data.slug}"`
    );
    validateRequired(data.excerpt, "excerpt", filePath);
    validateRequired(data.coverImage, "coverImage", filePath);
    validateRequired(data.tags, "tags", filePath);
    validateRequired(data.status, "status", filePath);
    if (data.status === "published") {
      validateRequired(data.publishedAt, "publishedAt", filePath);
    }
  }

  const reportFiles = listFiles(path.join(ROOT, "content/reports"), ".md");
  for (const filePath of reportFiles) {
    const data = readMarkdownData(filePath);
    validateRequired(data.title, "title", filePath);
    validateRequired(data.slug, "slug", filePath);
    assert(
      typeof data.slug === "string" &&
        !String(data.slug).includes("/") &&
        !String(data.slug).startsWith(" "),
      `[invalid] ${filePath}: slug must be a plain path segment (no slashes). Got "${data.slug}"`
    );
    validateRequired(data.excerpt, "excerpt", filePath);
    validateRequired(data.coverImage, "coverImage", filePath);
    validateRequired(data.reportPdf, "reportPdf", filePath);
    validateRequired(data.status, "status", filePath);
    if (data.status === "published") {
      validateRequired(data.publishedAt, "publishedAt", filePath);
    }
  }

  if (errors.length > 0) {
    console.error("Content validation failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log("Content validation passed.");
}

validate();
