#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const UPLOADS_DIR = path.join(process.cwd(), "assets/uploads");
const MAX_WIDTH = 1600;
const MAX_BYTES = 300 * 1024;
const QUALITY_STEPS = [82, 76, 70, 64, 58, 52, 46, 40];
const INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function gatherFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...gatherFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeToWebp(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (!INPUT_EXTENSIONS.has(ext)) return { skipped: true };

  const parsed = path.parse(sourcePath);
  const destinationPath = path.join(parsed.dir, `${parsed.name}.webp`);

  let bestBuffer = null;
  for (const quality of QUALITY_STEPS) {
    const buffer = await sharp(sourcePath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    bestBuffer = buffer;
    if (buffer.byteLength <= MAX_BYTES) break;
  }

  if (!bestBuffer || bestBuffer.byteLength > MAX_BYTES) {
    throw new Error(
      `${sourcePath} cannot be compressed under ${MAX_BYTES} bytes at max width ${MAX_WIDTH}px`
    );
  }

  fs.writeFileSync(destinationPath, bestBuffer);
  if (path.resolve(sourcePath) !== path.resolve(destinationPath)) {
    fs.unlinkSync(sourcePath);
  }

  return { skipped: false, destinationPath, bytes: bestBuffer.byteLength };
}

async function run() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("assets/uploads does not exist. Skipping optimization.");
    return;
  }

  const files = gatherFiles(UPLOADS_DIR);
  const nonCompliant = [];
  let optimizedCount = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!INPUT_EXTENSIONS.has(ext)) {
      if (ext === ".svg" || ext === ".gif" || ext === ".avif") continue;
      nonCompliant.push(`${filePath} has unsupported extension ${ext}`);
      continue;
    }

    const result = await optimizeToWebp(filePath);
    if (!result.skipped) optimizedCount += 1;
  }

  const postFiles = gatherFiles(UPLOADS_DIR);
  for (const filePath of postFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".webp" && ext !== ".svg" && ext !== ".gif" && ext !== ".avif") {
      nonCompliant.push(`${filePath} is not an allowed optimized format`);
      continue;
    }
    if (ext === ".webp") {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_BYTES) {
        nonCompliant.push(`${filePath} is ${stats.size} bytes, exceeds ${MAX_BYTES} byte limit`);
      }
      const metadata = await sharp(filePath).metadata();
      if (metadata.width && metadata.width > MAX_WIDTH) {
        nonCompliant.push(`${filePath} is ${metadata.width}px wide, exceeds ${MAX_WIDTH}px`);
      }
    }
  }

  if (nonCompliant.length > 0) {
    console.error("Upload optimization check failed:");
    nonCompliant.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log(`Upload optimization passed. Optimized ${optimizedCount} file(s).`);
}

run().catch((error) => {
  console.error(`Upload optimization failed: ${error.message}`);
  process.exit(1);
});
