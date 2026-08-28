const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

const defaultHeadingOpen =
  md.renderer.rules.heading_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  if (token.tag === "h2") {
    token.attrSet("class", "sub-heading");
  }
  return defaultHeadingOpen(tokens, idx, options, env, self);
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function relPrefix(depth) {
  return depth === 0 ? "." : "../".repeat(depth).slice(0, -1);
}

function preferWebpAsset(assetPath) {
  if (!assetPath || /^https?:\/\//.test(assetPath)) return assetPath;
  if (/\.webp$/i.test(assetPath)) return assetPath;
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  const webpPath = normalized.replace(/\.(png|jpe?g)$/i, ".webp");
  const fullPath = path.join(process.cwd(), webpPath.slice(1));
  return fs.existsSync(fullPath) ? webpPath : assetPath;
}

function resolveAsset(depth, assetPath, options = {}) {
  if (!assetPath) return depth === 0 ? "./" : "../".repeat(depth);
  if (/^https?:\/\//.test(assetPath)) {
    return optimizeCloudinaryUrl(assetPath, options.cloudinaryWidth);
  }
  const optimizedPath = preferWebpAsset(assetPath);
  const clean = optimizedPath.startsWith("/") ? optimizedPath.slice(1) : optimizedPath;
  const prefix = relPrefix(depth);
  return prefix === "." ? `./${clean}` : `${prefix}/${clean}`;
}

function resolveHomeHref(depth) {
  return depth === 0 ? "./" : "../".repeat(depth);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return { data: parsed.data, body: parsed.content.trim() };
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(dirPath, file));
}

function writeFileEnsured(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function formatPublishDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
    .toUpperCase();
}

function normalizeTagSlug(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Strip slashes/spaces so CMS slugs never create /stories//broken/ URLs. */
function normalizePostSlug(slug) {
  return String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^stories\//i, "")
    .replace(/\/+/g, "-");
}

function collapseMetaText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*Suggested URL Slug:?\s*/gi, " ")
    .trim();
}

const POST_TAG_TO_FILTER = {
  "student-stories": "students",
  "events-and-campus-life": "events",
  "impact-reports": "reports",
  "donor-highlights": "donors"
};

const FILTER_TAG_COLORS = {
  students: "#bce2f4",
  events: "#f6b931",
  reports: "#61cdbb",
  donors: "#222222",
  all: "#ffffff"
};

function getPostCategorySlug(post) {
  const primaryTag = (post?.tags && post.tags[0]) || "";
  const tagSlug = normalizeTagSlug(primaryTag);
  return POST_TAG_TO_FILTER[tagSlug] || "all";
}

function getPostTagColor(post) {
  return FILTER_TAG_COLORS[getPostCategorySlug(post)] || FILTER_TAG_COLORS.all;
}

function getPostSearchText(post) {
  return [post.title, post.excerpt, ...(post.tags || [])].filter(Boolean).join(" ");
}

function isReportPost(post) {
  return Boolean(post?.reportPdf) || getPostCategorySlug(post) === "reports";
}

function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => {
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return db - da;
  });
}

function getRelatedPosts(post, publishedPosts, limit = 4) {
  const others = publishedPosts.filter((item) => item.slug !== post.slug);
  const category = getPostCategorySlug(post);

  if (isReportPost(post)) {
    const reportPeers = others.filter((item) => isReportPost(item));
    if (reportPeers.length > 0) {
      return sortPostsByDate(reportPeers).slice(0, limit);
    }
  }

  const sameCategory = others.filter((item) => getPostCategorySlug(item) === category);
  const pool = sameCategory.length > 0 ? sameCategory : others;
  return sortPostsByDate(pool).slice(0, limit);
}

function markdownToHtml(markdown) {
  return md.render(markdown || "");
}

function resolveMarkdownPaths(html, depth) {
  return String(html || "").replace(/\b(src|href)="(\/[^"]*)"/g, (match, attr, assetPath) => {
    if (assetPath.startsWith("//")) return match;
    return `${attr}="${resolveAsset(depth, assetPath)}"`;
  });
}

function normalizeListStrings(items, preferredKeys = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (!item || typeof item !== "object") return "";
      for (const key of preferredKeys) {
        if (item[key] != null && item[key] !== "") return String(item[key]);
      }
      const first = Object.values(item).find((value) => value != null && value !== "");
      return first != null ? String(first) : "";
    })
    .filter(Boolean);
}

function optimizeCloudinaryUrl(url, width = 1200) {
  if (!/^https:\/\/res\.cloudinary\.com\//.test(String(url))) return url;
  if (/\/upload\/[^/]*(?:f_auto|q_auto)/.test(url)) return url;
  return String(url).replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

const FOOTER_CTA_BACKGROUND_IMAGE = optimizeCloudinaryUrl(
  "https://res.cloudinary.com/pr7r5p6g/image/upload/v1785746712/footer_iwzqaw.jpg",
  1400
);

let imageMetaCache = null;

function getImageMeta(assetPath) {
  if (!assetPath || /^https?:\/\//.test(assetPath)) return null;
  if (!imageMetaCache) {
    const metaPath = path.join(process.cwd(), "assets/image-meta.json");
    imageMetaCache = fs.existsSync(metaPath) ? readJson(metaPath) : {};
  }
  const key = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return imageMetaCache[key] || null;
}

function imageDimensionAttrs(assetPath) {
  const meta = getImageMeta(assetPath);
  if (!meta?.width || !meta?.height) return "";
  return `width="${meta.width}" height="${meta.height}"`;
}

function defaultFooterCta(depth) {
  return {
    title: "BE PART OF THE MOVEMENT.",
    buttonLabel: "Donate Now",
    buttonUrl: resolveAsset(depth, "donate/"),
    backgroundImage: FOOTER_CTA_BACKGROUND_IMAGE,
    backgroundImageAlt: "Volunteers packing food",
    qrImage: "/qr-code.png",
    qrImageAlt: "QR Code"
  };
}

module.exports = {
  escapeHtml,
  relPrefix,
  resolveAsset,
  resolveHomeHref,
  readJson,
  readMarkdown,
  listMarkdownFiles,
  writeFileEnsured,
  formatPublishDate,
  markdownToHtml,
  resolveMarkdownPaths,
  normalizeTagSlug,
  normalizePostSlug,
  collapseMetaText,
  normalizeListStrings,
  getPostCategorySlug,
  getPostTagColor,
  getPostSearchText,
  isReportPost,
  sortPostsByDate,
  getRelatedPosts,
  FOOTER_CTA_BACKGROUND_IMAGE,
  defaultFooterCta,
  preferWebpAsset,
  optimizeCloudinaryUrl,
  getImageMeta,
  imageDimensionAttrs
};
