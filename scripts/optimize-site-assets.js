#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = process.cwd();
const META_PATH = path.join(ROOT, "assets/image-meta.json");

const TARGETS = [
  { file: "donate.png", maxWidth: 1400, maxBytes: 180 * 1024 },
  { file: "img2.png", maxWidth: 900, maxBytes: 120 * 1024 },
  { file: "img3.png", maxWidth: 900, maxBytes: 120 * 1024 },
  { file: "img4.png", maxWidth: 900, maxBytes: 100 * 1024 },
  { file: "img5.png", maxWidth: 900, maxBytes: 120 * 1024 },
  { file: "img7.png", maxWidth: 900, maxBytes: 120 * 1024 },
  { file: "impact/impact/impact-hero-image.png", maxWidth: 1200, maxBytes: 180 * 1024 },
  { file: "about-us/about/photos/olga.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/joan.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/cyrus.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/victor.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/enock.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/alfred.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/martha.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/jazz.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/mercy.jpg", maxWidth: 640, maxBytes: 80 * 1024 },
  { file: "about-us/about/photos/team.jpg", maxWidth: 1200, maxBytes: 150 * 1024 }
];

const QUALITY_STEPS = [82, 76, 70, 64, 58, 52, 46, 40];

async function optimizeFile({ file, maxWidth, maxBytes }) {
  const sourcePath = path.join(ROOT, file);
  if (!fs.existsSync(sourcePath)) {
    return { skipped: true, reason: "missing" };
  }

  const parsed = path.parse(sourcePath);
  const destinationPath = path.join(parsed.dir, `${parsed.name}.webp`);
  let bestBuffer = null;

  for (const quality of QUALITY_STEPS) {
    const buffer = await sharp(sourcePath)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    bestBuffer = buffer;
    if (buffer.byteLength <= maxBytes) break;
  }

  if (!bestBuffer || bestBuffer.byteLength > maxBytes) {
    throw new Error(`${file} cannot be compressed under ${maxBytes} bytes`);
  }

  fs.writeFileSync(destinationPath, bestBuffer);
  const metadata = await sharp(destinationPath).metadata();

  return {
    skipped: false,
    webp: path.relative(ROOT, destinationPath).replace(/\\/g, "/"),
    width: metadata.width || 0,
    height: metadata.height || 0,
    bytes: bestBuffer.byteLength
  };
}

async function run() {
  const meta = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, "utf8")) : {};
  let optimizedCount = 0;

  for (const target of TARGETS) {
    try {
      const result = await optimizeFile(target);
      if (result.skipped) continue;
      meta[`/${result.webp}`] = { width: result.width, height: result.height };
      optimizedCount += 1;
      console.log(`Optimized ${target.file} -> ${result.webp} (${result.bytes} bytes)`);
    } catch (error) {
      console.warn(`Skipped ${target.file}: ${error.message}`);
    }
  }

  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  console.log(`Site asset optimization complete. Optimized ${optimizedCount} file(s).`);
}

run().catch((error) => {
  console.error(`Site asset optimization failed: ${error.message}`);
  process.exit(1);
});
