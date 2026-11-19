const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { resolveAsset, optimizeCloudinaryUrl, preferWebpAsset } = require('./lib/utils');

test('Cloudinary photos preserve original URLs at every requested display size', () => {
  const original = 'https://res.cloudinary.com/example/image/upload/v123/photo.jpg';
  for (const width of [800, 1200, 1400]) {
    assert.equal(resolveAsset(1, original, { cloudinaryWidth: width }), original);
    assert.equal(optimizeCloudinaryUrl(original, width), original);
  }
});

test('existing original photos are preferred over compressed copies', () => {
  assert(fs.existsSync('donate.png'));
  assert.equal(preferWebpAsset('/donate.png'), '/donate.png');
  assert.equal(preferWebpAsset('/donate.webp'), '/donate.png');
  assert.equal(resolveAsset(1, '/donate.png'), '../donate.png');
});

test('regular builds do not recompress uploaded photos', () => {
  const scripts = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts;
  assert.doesNotMatch(scripts.prebuild, /optimize-uploads|optimize-site-assets/);
});
