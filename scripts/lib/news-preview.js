const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const matter = require('gray-matter');
const { unescapeAll } = require('markdown-it')().utils;
const { getPostSourceUrl } = require('./utils');

const FALLBACK_IMAGE = '/assets/uploads/learn_and_lunch_004.webp';

function extractPreviewImage(html, pageUrl) {
  const metadata = new Map();
  // Read quoted attributes independently of their order in each meta tag.
  for (const tag of html.match(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi) || []) {
    const attrs = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[match[1].toLowerCase()] = unescapeAll(match[2] ?? match[3] ?? match[4]);
    }
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (!metadata.has(key) && attrs.content) metadata.set(key, attrs.content);
  }
  for (const key of ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']) {
    try {
      if (!metadata.get(key)) continue;
      const url = new URL(metadata.get(key), pageUrl);
      if (['http:', 'https:'].includes(url.protocol)) return url.href;
    } catch { /* Try the next preview field. */ }
  }
  return '';
}

async function populateNewsImages(posts, fetchPage = fetch) {
  const externalPosts = posts.filter((post) => getPostSourceUrl(post));
  for (let offset = 0; offset < externalPosts.length; offset += 4) {
    await Promise.all(externalPosts.slice(offset, offset + 4).map(async (post) => {
      if (post.coverImage && !/^https?:\/\//.test(post.coverImage)) return;
      if (!post.coverImage && post.fetchCoverImage === false) {
        post.coverImage = FALLBACK_IMAGE;
        return;
      }
      try {
        let imageUrl = post.coverImage;
        if (!imageUrl) {
          const response = await fetchPage(getPostSourceUrl(post), {
            signal: AbortSignal.timeout(10000), headers: { Accept: 'text/html' }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          imageUrl = extractPreviewImage(await response.text(), response.url || post.sourceUrl);
        }
        if (!imageUrl) throw new Error('No preview image found');
        const imageResponse = await fetchPage(imageUrl, { signal: AbortSignal.timeout(15000) });
        if (!imageResponse.ok) throw new Error(`Image HTTP ${imageResponse.status}`);
        const input = Buffer.from(await imageResponse.arrayBuffer());
        let output;
        for (const width of [1200, 960, 720, 480]) {
          output = await sharp(input).rotate().resize({ width, withoutEnlargement: true })
            .webp({ quality: 75 }).toBuffer();
          if (output.length <= 300 * 1024) break;
        }
        if (output.length > 300 * 1024) throw new Error('Preview exceeds upload size limit');
        const filename = `external-${path.basename(post.filePath, '.md')}.webp`;
        const localUrl = `/assets/uploads/${filename}`;
        fs.mkdirSync(path.join(process.cwd(), 'assets/uploads'), { recursive: true });
        fs.writeFileSync(path.join(process.cwd(), localUrl.slice(1)), output);
        const original = matter.read(post.filePath);
        original.data.coverImage = localUrl;
        fs.writeFileSync(post.filePath, matter.stringify(original.content, original.data));
        post.coverImage = localUrl;
      } catch (error) {
        console.warn(`Preview unavailable for ${post.slug}: ${error.message}`);
      }
      if (!post.coverImage || /^https?:\/\//.test(post.coverImage)) post.coverImage = FALLBACK_IMAGE;
      post.coverImageAlt ||= post.title;
    }));
  }
}

module.exports = { extractPreviewImage, populateNewsImages };
