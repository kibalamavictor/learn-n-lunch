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
      if (post.coverImage) return; // A CMS image always wins.
      try {
        const response = await fetchPage(getPostSourceUrl(post), {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: 'text/html' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        post.coverImage = extractPreviewImage(await response.text(), response.url || post.sourceUrl);
      } catch (error) {
        console.warn(`Preview unavailable for ${post.slug}: ${error.message}`);
      }
      post.coverImage ||= FALLBACK_IMAGE;
      post.coverImageAlt ||= post.title;
    }));
  }
}

module.exports = { extractPreviewImage, populateNewsImages };
