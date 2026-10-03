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

const defaultImageRender =
  md.renderer.rules.image ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const title = token.attrGet("title");
  const imageHtml = defaultImageRender(tokens, idx, options, env, self);

  if (!title || !String(title).trim()) {
    return imageHtml;
  }

  return `<figure class="story-figure">${imageHtml}<figcaption class="story-photo-credit">${escapeHtml(
    String(title).trim()
  )}</figcaption></figure>`;
};

const QUOTE_ATTRIBUTION = /^\s*\\?(?:—|–|-{1,2})\s*(\S[\s\S]*)$/;
const OPENING_QUOTE = /^["“„«']/;
const CLOSING_QUOTE = /["”»']$/;

function findBlockquoteClose(tokens, openIdx) {
  const level = tokens[openIdx].level;
  for (let i = openIdx + 1; i < tokens.length; i++) {
    if (tokens[i].type === "blockquote_close" && tokens[i].level === level) return i;
  }
  return -1;
}

// "- Name" on the last line parses as a one-item bullet list, not a paragraph.
function extractListAttribution(tokens, openIdx, closeIdx) {
  const listClose = tokens[closeIdx - 1];
  if (listClose?.type !== "bullet_list_close" || listClose.markup !== "-") return null;
  const listOpenIdx = closeIdx - 7;
  const item = tokens.slice(listOpenIdx, closeIdx);
  const expected = [
    "bullet_list_open",
    "list_item_open",
    "paragraph_open",
    "inline",
    "paragraph_close",
    "list_item_close",
    "bullet_list_close"
  ];
  if (listOpenIdx <= openIdx + 1 || item.some((token, i) => token.type !== expected[i])) return null;

  const attribution = item[3].content.trim();
  if (!attribution) return null;
  tokens.splice(listOpenIdx, 7);
  return attribution;
}

function extractQuoteAttribution(tokens, openIdx, closeIdx) {
  const fromList = extractListAttribution(tokens, openIdx, closeIdx);
  if (fromList) return fromList;

  const pClose = tokens[closeIdx - 1];
  const inline = tokens[closeIdx - 2];
  const pOpen = tokens[closeIdx - 3];
  if (pClose?.type !== "paragraph_close" || inline?.type !== "inline" || pOpen?.type !== "paragraph_open") {
    return "";
  }

  const ownParagraph = inline.content.match(QUOTE_ATTRIBUTION);
  if (ownParagraph) {
    if (closeIdx - 3 === openIdx + 1) return "";
    tokens.splice(closeIdx - 3, 3);
    return ownParagraph[1].trim();
  }

  const lastBreak = inline.content.lastIndexOf("\n");
  if (lastBreak === -1) return "";
  const trailingLine = inline.content.slice(lastBreak + 1).match(QUOTE_ATTRIBUTION);
  if (!trailingLine) return "";

  const children = inline.children || [];
  let breakIdx = children.length - 1;
  while (breakIdx >= 0 && children[breakIdx].type !== "softbreak" && children[breakIdx].type !== "hardbreak") {
    breakIdx--;
  }
  if (breakIdx < 0) return "";
  inline.children = children.slice(0, breakIdx);
  inline.content = inline.content.slice(0, lastBreak);
  return trailingLine[1].trim();
}

function stripWrappingQuoteMarks(tokens, openIdx, closeIdx) {
  const inlines = tokens.slice(openIdx + 1, closeIdx).filter((token) => token.type === "inline");
  if (!inlines.length) return;
  const firstText = (inlines[0].children || []).find((child) => child.type === "text");
  const lastChildren = inlines[inlines.length - 1].children || [];
  const lastText = [...lastChildren].reverse().find((child) => child.type === "text");
  if (!firstText || !lastText) return;
  if (!OPENING_QUOTE.test(firstText.content) || !CLOSING_QUOTE.test(lastText.content)) return;
  if (firstText === lastText && firstText.content.length < 2) return;

  firstText.content = firstText.content.replace(OPENING_QUOTE, "");
  lastText.content = lastText.content.replace(CLOSING_QUOTE, "");
}

md.core.ruler.push("story_quotes", (state) => {
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== "blockquote_open") continue;
    let closeIdx = findBlockquoteClose(tokens, i);
    if (closeIdx === -1) continue;

    const before = tokens.length;
    const attribution = extractQuoteAttribution(tokens, i, closeIdx);
    closeIdx -= before - tokens.length;
    stripWrappingQuoteMarks(tokens, i, closeIdx);
    tokens[i].meta = { ...(tokens[i].meta || {}), attribution };
  }
});

md.renderer.rules.blockquote_open = function (tokens, idx) {
  const attribution = tokens[idx].meta?.attribution;
  const variant = attribution ? "story-quote" : "story-quote story-quote--pull";
  return `<figure class="${variant}">\n<blockquote>\n`;
};

md.renderer.rules.blockquote_close = function (tokens, idx) {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === "blockquote_close") depth++;
    if (tokens[i].type === "blockquote_open") {
      if (depth === 0) {
        const attribution = tokens[i].meta?.attribution;
        const caption = attribution
          ? `<figcaption class="story-quote__source">${md.renderInline(attribution)}</figcaption>\n`
          : "";
        return `</blockquote>\n${caption}</figure>\n`;
      }
      depth--;
    }
  }
  return "</blockquote>\n";
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function relPrefix(depth) {
  if (depth === "absolute") return "";
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
  if (!assetPath) return resolveHomeHref(depth);
  if (/^https?:\/\//.test(assetPath)) {
    return optimizeCloudinaryUrl(assetPath, options.cloudinaryWidth);
  }
  const optimizedPath = preferWebpAsset(assetPath);
  const clean = optimizedPath.startsWith("/") ? optimizedPath.slice(1) : optimizedPath;
  const prefix = relPrefix(depth);
  return prefix === "." ? `./${clean}` : `${prefix}/${clean}`;
}

function resolveHomeHref(depth) {
  if (depth === "absolute") return "/";
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

function getPostCategorySlugs(post) {
  const slugs = (post?.tags || [])
    .map((tag) => POST_TAG_TO_FILTER[normalizeTagSlug(tag)])
    .filter(Boolean);
  return slugs.length ? [...new Set(slugs)] : ["all"];
}

function getPostTagColor(post) {
  return FILTER_TAG_COLORS[getPostCategorySlug(post)] || FILTER_TAG_COLORS.all;
}

function getPostSearchText(post) {
  return [post.title, post.excerpt, post.author, ...(post.tags || [])].filter(Boolean).join(" ");
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

function markdownInline(markdown) {
  return md.renderInline(String(markdown || ""));
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
  markdownInline,
  resolveMarkdownPaths,
  normalizeTagSlug,
  normalizePostSlug,
  collapseMetaText,
  normalizeListStrings,
  getPostCategorySlug,
  getPostCategorySlugs,
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
