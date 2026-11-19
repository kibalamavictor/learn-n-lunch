const { test } = require('node:test');
const assert = require('node:assert/strict');
const { heroImagePosition, renderPhotoHeroContent } = require('./lib/photo-hero');

test('hero crop supports zero, defaults safely, and stays within image bounds', () => {
  assert.equal(heroImagePosition(0), 0);
  assert.equal(heroImagePosition('75'), 75);
  for (const input of [null, undefined, '', 'invalid']) assert.equal(heroImagePosition(input), 60);
  assert.equal(heroImagePosition(-10), 0);
  assert.equal(heroImagePosition(110), 100);
});

test('page-specific photos and crops render independently and escape descriptions', () => {
  const first = renderPhotoHeroContent({ heroImage: '/assets/uploads/one.jpg', heroImagePosition: 25, heroImageAlt: 'People "together"', heading: 'One', intro: 'Intro' }, 1);
  const second = renderPhotoHeroContent({ heroImage: '/assets/uploads/two.jpg', heroImagePosition: 80, heading: 'Two' }, 1);
  assert.match(first, /src="\.\.\/assets\/uploads\/one.jpg"/);
  assert.match(first, /center 25%/);
  assert.match(first, /People &quot;together&quot;/);
  assert.match(second, /two.jpg/);
  assert.match(second, /center 80%/);
  assert.doesNotMatch(second, /one.jpg/);
});

test('hero uses the original full-resolution Cloudinary image without added transformations', () => {
  const original = 'https://res.cloudinary.com/example/image/upload/v123/hero.jpg';
  const html = renderPhotoHeroContent({ heroImage: original, heading: 'Hero' }, 1);
  assert(html.includes(`src="${original}"`));
  assert.doesNotMatch(html, /f_auto|q_auto|w_1200/);
  const fallback = renderPhotoHeroContent({ heading: 'Hero' }, 1);
  assert.doesNotMatch(fallback, /f_auto|q_auto|w_1200/);
});
