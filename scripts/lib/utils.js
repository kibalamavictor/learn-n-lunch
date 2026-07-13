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

function resolveAsset(depth, assetPath) {
  if (!assetPath) return depth === 0 ? "./" : "../".repeat(depth);
  if (/^https?:\/\//.test(assetPath)) return assetPath;
  const clean = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
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

function markdownToHtml(markdown) {
  return md.render(markdown || "");
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
  markdownToHtml
};
