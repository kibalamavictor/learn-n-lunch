const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

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
  const lines = markdown.split("\n");
  const chunks = [];
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    chunks.push(`<p>${escapeHtml(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      chunks.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      chunks.push(`<h2 class="sub-heading">${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }
    paragraph.push(trimmed);
  }

  flushParagraph();
  return chunks.join("\n        ");
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
