// Check the published, canonical pages from the generated sitemap.
const fs = require('fs');
const assert = require('assert');
const { URL } = require('url');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const titles = new Set(); const descriptions = new Set();
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const html = fs.readFileSync(`.${pathname}index.html`, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && !titles.has(title), `Missing/duplicate title: ${url}`);
  assert(desc && !descriptions.has(desc), `Missing/duplicate description: ${url}`);
  titles.add(title); descriptions.add(desc);
  assert(html.includes(`rel="canonical" href="${url}"`), `Canonical: ${url}`);
  assert(!/name="robots" content="[^"]*noindex/.test(html), `Noindex: ${url}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `H1: ${url}`);
  for (const image of html.match(/<img\b[^>]*>/g) || []) assert(/\balt=/.test(image), `Image alt: ${url}`);
  for (const key of ['og:title', 'og:description', 'og:url', 'twitter:card']) assert(html.includes(key), `Social tag ${key}: ${url}`);
  for (const block of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(block[1]);
}
assert(fs.readFileSync('robots.txt','utf8').includes('Sitemap: https://www.learnandlunch.org/sitemap.xml'));
console.log(`SEO checks passed for ${urls.length} canonical pages.`);
