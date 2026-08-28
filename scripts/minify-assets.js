#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyFile(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) return false;
  const original = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, minifyCss(original), "utf8");
  return true;
}

function run() {
  if (minifyFile("dist/style.css")) {
    console.log("Minified dist/style.css");
  } else {
    console.log("dist/style.css not found; skipping CSS minification.");
  }
}

run();
