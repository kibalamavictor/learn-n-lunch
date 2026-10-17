#!/usr/bin/env node
/**
 * Build summit-poster/template.jpg and template-overlay.png from the authored
 * 1024×1024 artwork. Keeps the source JPEG bytes for the preview, and writes a
 * lossless PNG overlay with only the cyan photo slot punched out.
 *
 * Usage: node scripts/build-summit-poster-templates.js [path-to-artwork.jpg]
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DEFAULT_SRC = path.join(
  __dirname,
  "../summit-poster/source.jpg"
);
const OUT_DIR = path.join(__dirname, "../summit-poster");

function isHole(r, g, b) {
  return r < 20 && g > 160 && g < 185 && b > 225 && b - r > 200;
}

function dilateMask(mask, W, H, radius) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (dx * dx + dy * dy <= radius * radius) out[ny * W + nx] = 1;
        }
      }
    }
  }
  return out;
}

function holeGeometry(pts) {
  let mx = 0;
  let my = 0;
  pts.forEach(([x, y]) => {
    mx += x;
    my += y;
  });
  mx /= pts.length;
  my /= pts.length;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  pts.forEach(([x, y]) => {
    const dx = x - mx;
    const dy = y - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  });
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const uv = pts.map(([x, y]) => {
    const dx = x - mx;
    const dy = y - my;
    return [dx * cos - dy * sin, dx * sin + dy * cos];
  });
  const us = uv.map((u) => u[0]).sort((a, b) => a - b);
  const vs = uv.map((u) => u[1]).sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.floor(p * (arr.length - 1))];
  const minU = q(us, 0.01);
  const maxU = q(us, 0.99);
  const minV = q(vs, 0.01);
  const maxV = q(vs, 0.99);
  const spanU = maxU - minU;
  const spanV = maxV - minV;
  const toWorld = (u, v) => {
    const dx = u * Math.cos(angle) - v * Math.sin(angle);
    const dy = u * Math.sin(angle) + v * Math.cos(angle);
    return [mx + dx, my + dy];
  };
  let p1;
  let p2;
  let width;
  let height;
  let rotAngle;
  if (spanU <= spanV) {
    p1 = toWorld(minU, minV);
    p2 = toWorld(maxU, minV);
    width = spanU;
    height = spanV;
    rotAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  } else {
    p1 = toWorld(minU, minV);
    p2 = toWorld(minU, maxV);
    width = spanV;
    height = spanU;
    rotAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  }
  return {
    center: [+mx.toFixed(2), +my.toFixed(2)],
    angle: rotAngle,
    width,
    height
  };
}

async function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;
  if (!fs.existsSync(src)) {
    console.error("Source artwork not found:", src);
    process.exit(1);
  }

  const meta = await sharp(src).metadata();
  if (meta.width !== 1024 || meta.height !== 1024) {
    console.error("Artwork must be 1024×1024 px.");
    process.exit(1);
  }

  fs.copyFileSync(src, path.join(OUT_DIR, "template.jpg"));

  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const mask = new Uint8Array(W * H);
  const pts = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (isHole(data[i], data[i + 1], data[i + 2])) {
        mask[y * W + x] = 1;
        pts.push([x, y]);
      }
    }
  }
  if (pts.length < 1000) {
    console.error("Cyan photo slot not found — check #00adef fill in the artwork.");
    process.exit(1);
  }

  const geom = holeGeometry(pts);
  console.log("Update js/summit-poster.js HOLE if these change:");
  console.log(JSON.stringify(geom, null, 2));

  const dilated = dilateMask(mask, W, H, 4);
  const overlay = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      overlay[i] = data[i];
      overlay[i + 1] = data[i + 1];
      overlay[i + 2] = data[i + 2];
      overlay[i + 3] = dilated[y * W + x] ? 0 : 255;
    }
  }
  await sharp(overlay, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(path.join(OUT_DIR, "template-overlay.png"));

  console.log("Wrote", path.join(OUT_DIR, "template.jpg"));
  console.log("Wrote", path.join(OUT_DIR, "template-overlay.png"));
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
