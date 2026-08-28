const { escapeHtml, collapseMetaText, optimizeCloudinaryUrl } = require("./utils");

const DEFAULT_SITE_URL = "https://www.learnandlunch.org";

function getSiteUrl(site) {
  return String(site?.siteUrl || DEFAULT_SITE_URL).replace(/\/$/, "");
}

function normalizeCanonicalPath(pathname) {
  if (!pathname || pathname === "/") return "/";
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

function buildCanonicalUrl(site, pathname) {
  return `${getSiteUrl(site)}${normalizeCanonicalPath(pathname)}`;
}

function toAbsoluteAssetUrl(site, assetPath, options = {}) {
  if (!assetPath) return "";
  if (/^https?:\/\//.test(assetPath)) {
    return optimizeCloudinaryUrl(assetPath, options.cloudinaryWidth || 1200);
  }
  const clean = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${getSiteUrl(site)}${clean}`;
}

function resolvePageSeo({ site, page = {}, canonicalPath, defaults = {} }) {
  const title = page.seoTitle || defaults.title || site.defaultSeoTitle;
  const description = collapseMetaText(
    page.seoDescription || defaults.description || site.defaultSeoDescription
  );
  const ogImage = page.ogImage || defaults.ogImage || site.defaultOgImage || null;

  return {
    title,
    description,
    ogImage,
    canonicalPath: normalizeCanonicalPath(canonicalPath),
    ogType: defaults.ogType || "website"
  };
}

function renderJsonLd(data) {
  if (!data) return "";
  const blocks = Array.isArray(data) ? data : [data];
  return blocks
    .filter(Boolean)
    .map(
      (block) =>
        `    <script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`
    )
    .join("\n");
}

function buildOrganizationJsonLd(site) {
  const siteUrl = getSiteUrl(site);
  const sameAs = (site.socialLinks || []).map((link) => link.url).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    ...(sameAs.length ? { sameAs } : {})
  };
}

function buildWebSiteJsonLd(site) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteName,
    url: getSiteUrl(site),
    description: site.defaultSeoDescription
  };
}

function buildBlogPostingJsonLd({ site, post, canonicalUrl, imageUrl }) {
  const published = post.publishedAt || post.updatedAt;
  const modified = post.updatedAt || post.publishedAt;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: collapseMetaText(post.seoDescription || post.excerpt || ""),
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: published || undefined,
    dateModified: modified || published || undefined,
    author: {
      "@type": "Organization",
      name: site.siteName,
      url: getSiteUrl(site)
    },
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${getSiteUrl(site)}/logo.png`
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };
}

function buildBreadcrumbJsonLd(site, items) {
  if (!items?.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(site, item.path)
    }))
  };
}

function renderSeoHead({
  site,
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = "website",
  structuredData = []
}) {
  const canonicalUrl = buildCanonicalUrl(site, canonicalPath);
  const metaDescription = collapseMetaText(description);
  const absoluteOgImage = ogImage ? toAbsoluteAssetUrl(site, ogImage) : "";

  const openGraph = absoluteOgImage
    ? `
    <meta property="og:type" content="${escapeHtml(ogType)}">
    <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="en_US">
    <meta property="og:image" content="${escapeHtml(absoluteOgImage)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
    <meta name="twitter:image" content="${escapeHtml(absoluteOgImage)}">`
    : `
    <meta property="og:type" content="${escapeHtml(ogType)}">
    <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">`;

  return `
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    ${openGraph}
${renderJsonLd(structuredData)}`;
}

function buildSitemapEntries({ site, publishedBlogPosts }) {
  const siteUrl = getSiteUrl(site);
  const staticPages = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/about-us/", changefreq: "monthly", priority: "0.9" },
    { path: "/impact/", changefreq: "monthly", priority: "0.9" },
    { path: "/stories/", changefreq: "weekly", priority: "0.9" },
    { path: "/get-involved/", changefreq: "monthly", priority: "0.8" },
    { path: "/donate/", changefreq: "monthly", priority: "0.8" },
    { path: "/contact-us/", changefreq: "monthly", priority: "0.7" }
  ];

  const blogEntries = publishedBlogPosts.map((post) => ({
    path: `/stories/${post.slug}/`,
    changefreq: "monthly",
    priority: "0.7",
    lastmod: post.updatedAt || post.publishedAt || null
  }));

  return [...staticPages, ...blogEntries].map((entry) => ({
    loc: `${siteUrl}${normalizeCanonicalPath(entry.path)}`,
    changefreq: entry.changefreq,
    priority: entry.priority,
    lastmod: entry.lastmod
  }));
}

function renderSitemapXml(entries) {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${new Date(entry.lastmod).toISOString().slice(0, 10)}</lastmod>`
        : "";
      return `  <url>
    <loc>${entry.loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

module.exports = {
  getSiteUrl,
  buildCanonicalUrl,
  toAbsoluteAssetUrl,
  resolvePageSeo,
  renderSeoHead,
  renderJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildSitemapEntries,
  renderSitemapXml
};
