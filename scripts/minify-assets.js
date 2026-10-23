#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function shieldCalcs(source) {
  const calcs = [];
  let out = "";
  let i = 0;

  while (i < source.length) {
    if (source.startsWith("calc(", i)) {
      let depth = 0;
      let j = i;
      for (; j < source.length; j++) {
        if (source[j] === "(") depth++;
        else if (source[j] === ")") {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      const id = calcs.length;
      calcs.push(source.slice(i, j).replace(/\s+/g, " ").trim());
      out += `__CALC_${id}__`;
      i = j;
    } else {
      out += source[i];
      i++;
    }
  }

  return { out, calcs };
}

function minifyCss(source) {
  const { out, calcs } = shieldCalcs(source.replace(/\/\*[\s\S]*?\*\//g, ""));
  return out
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim()
    .replace(/__CALC_(\d+)__/g, (_, id) => calcs[Number(id)]);
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
