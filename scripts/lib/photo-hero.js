const { escapeHtml, resolveAsset } = require('./utils');

const DEFAULT_HERO_IMAGE = 'https://res.cloudinary.com/jxgiku8t/image/upload/v1794983049/learn-and-lunch-food-security-summit-2026.jpg';

function heroImagePosition(value) {
  const position = value === '' || value == null ? 60 : Number(value);
  return Number.isFinite(position) ? Math.max(0, Math.min(100, position)) : 60;
}

function renderPhotoHeroContent(page, depth) {
  return `<div class="lnl-hero-content">
    <img class="lnl-hero-background" src="${escapeHtml(resolveAsset(depth, page.heroImage || DEFAULT_HERO_IMAGE, { optimizeCloudinary: false }))}" alt="${escapeHtml(page.heroImageAlt || '')}" style="object-position: center ${heroImagePosition(page.heroImagePosition)}%;" fetchpriority="high" decoding="async">
    <div class="lnl-hero-photo-card">
      <h1>${escapeHtml(page.heading)}</h1>
      <p>${escapeHtml(page.intro)}</p>
    </div>
  </div>`;
}

module.exports = { heroImagePosition, renderPhotoHeroContent };
