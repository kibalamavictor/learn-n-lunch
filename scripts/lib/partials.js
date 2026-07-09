const { escapeHtml, resolveAsset, resolveHomeHref } = require("./utils");

const SOCIAL_ICONS = {
  TikTok:
    '<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>',
  Instagram:
    '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
  X: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
  LinkedIn:
    '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>'
};

function renderHead({ depth, title, description }) {
  const styleHref = resolveAsset(depth, "dist/style.css");
  const faviconHref = resolveAsset(depth, "lnl-favicon.svg");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ""}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@1,600&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${styleHref}" />
    <link rel="icon" type="image/png" sizes="32x32" href="${faviconHref}">
    <link rel="icon" type="image/png" sizes="16x16" href="${faviconHref}">
    <link rel="apple-touch-icon" sizes="180x180" href="${faviconHref}">`;
}

function renderNav({ depth, site, activePath, navbarStyle = "" }) {
  const logoHref = resolveHomeHref(depth);
  const logoSrc = resolveAsset(depth, "logo.png");
  const heartSrc = resolveAsset(depth, "heart-black.svg");
  const donateHref = resolveAsset(depth, "donate/");

  const navItems = site.navigation
    .map((item) => {
      const isHome = item.href === "/" || item.href === "";
      const href = isHome
        ? resolveHomeHref(depth)
        : item.href.startsWith("http") || item.href.startsWith("mailto:")
          ? item.href
          : resolveAsset(depth, item.href.replace(/^\//, ""));
      const isActive = activePath && item.href.replace(/\/$/, "") === activePath.replace(/\/$/, "");
      return `<li><a href="${href}" class="nav-link${isActive ? " active" : ""}">${escapeHtml(item.label)}</a></li>`;
    })
    .join("\n          ");

  return `
    <nav class="navbar"${navbarStyle ? ` style="${navbarStyle}"` : ""}>
      <div class="nav-container">
        <a href="${logoHref}" class="logo">
           <img src="${logoSrc}" alt="Learn N' Lunch Logo" class="logo">
        </a>

        <button class="mobile-menu-toggle" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul class="nav-menu">
          ${navItems}
          <li class="mobile-donate">
            <a href="${donateHref}" class="donate-btn">
              <span><img src="${heartSrc}" style="width: 14px;"></span> Donate
            </a>
          </li>
        </ul>

        <a href="${donateHref}" class="donate-btn desktop-donate">
          <span><img src="${heartSrc}" style="width: 14px;"></span> Donate
        </a>
      </div>
    </nav>`;
}

function renderFooterCta({ depth, cta, extraClass = "" }) {
  if (!cta) return "";
  const heartSrc = resolveAsset(depth, "heart-white.svg");

  return `
<section class="footer-cta-section${extraClass ? ` ${extraClass}` : ""}">
    <div class="footer-cta-container">
        <div class="footer-cta-banner">
            <img src="${resolveAsset(depth, cta.backgroundImage)}" alt="${escapeHtml(cta.backgroundImageAlt || "")}" class="footer-cta-bg">
            <div class="footer-cta-overlay"></div>
            
            <div class="footer-cta-card">
                <div class="footer-cta-content">
                    <h2 class="footer-cta-title">
                        ${escapeHtml(cta.title)}
                    </h2>
                    <a href="${escapeHtml(cta.buttonUrl)}" class="footer-cta-button">
                        <span><img src="${heartSrc}" style="width: 14px;"></span>
                        <span>${escapeHtml(cta.buttonLabel)}</span>
                    </a>
                </div>
                
                <div class="footer-cta-qr">
                    <img src="${resolveAsset(depth, cta.qrImage)}" alt="${escapeHtml(cta.qrImageAlt || "QR Code")}">
                </div>
            </div>
        </div>
        <hr>
    </div>
</section>`;
}

function renderFooter({ depth, site }) {
  const logoHref = resolveHomeHref(depth);
  const logoSrc = resolveAsset(depth, "logo.png");

  const social = site.socialLinks
    .map((link) => {
      const icon = SOCIAL_ICONS[link.platform] || SOCIAL_ICONS.LinkedIn;
      return `<a href="${escapeHtml(link.url)}" class="footer-social-link" aria-label="${escapeHtml(link.platform)}">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    ${icon}
                </svg>
            </a>`;
    })
    .join("\n            ");

  return `
<footer class="footer-main">
    <div class="footer-content">
        <div class="footer-social">
            ${social}
        </div>

        <div class="footer-logo">
            <a href="${logoHref}" >
              <img src="${logoSrc}" alt="Learn n' Lunch Logo">
            </a>
        </div>

        <div class="footer-copyright">
            ${escapeHtml(site.footerCopyright)}
        </div>
    </div>
</footer>`;
}

function renderPage({
  site,
  depth,
  title,
  description,
  activePath,
  navbarStyle,
  body,
  scripts = ["js/ap.js"],
  headExtra = "",
  footerCta
}) {
  const scriptTags = scripts
    .map((script) => `<script src="${resolveAsset(depth, script)}"></script>`)
    .join("\n    ");

  return `${renderHead({ depth, title, description })}${headExtra}
</head>
<body>
${renderNav({ depth, site, activePath, navbarStyle })}
${body}
${renderFooterCta({ depth, cta: footerCta })}
${renderFooter({ depth, site })}
    ${scriptTags}
</body>
</html>`;
}

module.exports = {
  renderHead,
  renderNav,
  renderFooter,
  renderFooterCta,
  renderPage
};
