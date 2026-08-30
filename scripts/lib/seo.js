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
  const ogImageAlt = page.ogImageAlt || defaults.ogImageAlt || site.defaultOgImageAlt || null;

  return {
    title,
    description,
    ogImage,
    ogImageAlt,
    keywords: page.seoKeywords || defaults.keywords || null,
    canonicalPath: normalizeCanonicalPath(canonicalPath),
    ogType: defaults.ogType || "website"
  };
}

function toIsoDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function resolveBlogPostSeo({ site, post }) {
  const title = post.seoTitle || `${post.title} | ${site.siteName}`;
  const description = collapseMetaText(post.seoDescription || post.excerpt || "");
  const ogImage = post.ogImage || post.coverImage || site.defaultOgImage || null;
  const ogImageAlt = post.coverImageAlt || post.title;
  const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];
  const keywords = post.seoKeywords || tags.join(", ");
  const publishedTime = toIsoDateTime(post.publishedAt);
  const modifiedTime = toIsoDateTime(post.updatedAt || post.publishedAt);

  return {
    title,
    description,
    ogImage,
    ogImageAlt,
    keywords: keywords || null,
    canonicalPath: normalizeCanonicalPath(`/stories/${post.slug}/`),
    ogType: "article",
    articleMeta: {
      publishedTime,
      modifiedTime,
      section: tags[0] || "Stories",
      author: post.author || site.siteName
    }
  };
}

function normalizeFaqItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      if (typeof entry === "string") return null;
      const question = entry?.question ? String(entry.question).trim() : "";
      const answer = entry?.answer ? String(entry.answer).trim() : "";
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean);
}

function renderFaqSection(faqItems, heading = "Frequently Asked Questions") {
  const items = normalizeFaqItems(faqItems);
  if (!items.length) return "";

  const markup = items
    .map(
      (item) => `
    <details class="lnl-faq-item">
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>`
    )
    .join("");

  return `
<section class="form-section lnl-faq" aria-labelledby="page-faq-heading">
  <h2 id="page-faq-heading" class="section-label">${escapeHtml(heading)}</h2>
  <div class="lnl-faq-list">${markup}
  </div>
</section>`;
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
  const contact = site.contact || {};
  const knowsAbout = Array.isArray(site.knowsAbout)
    ? site.knowsAbout.filter(Boolean)
    : [];

  const org = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: site.siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: site.defaultSeoDescription,
    areaServed: site.areaServed || "Uganda",
    ...(knowsAbout.length ? { knowsAbout } : {}),
    ...(sameAs.length ? { sameAs } : {})
  };

  if (contact.email || contact.phone) {
    org.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.phone ? { telephone: contact.phone } : {}),
        areaServed: site.areaServed || "UG",
        availableLanguage: ["English"]
      }
    ];
  }

  if (contact.address) {
    org.address = {
      "@type": "PostalAddress",
      addressLocality: contact.address,
      addressCountry: "UG"
    };
  }

  return org;
}

function buildWebSiteJsonLd(site) {
  const siteUrl = getSiteUrl(site);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteName,
    url: siteUrl,
    description: site.defaultSeoDescription,
    publisher: {
      "@type": "NGO",
      name: site.siteName,
      url: siteUrl
    }
  };
}

function buildBlogPostingJsonLd({ site, post, canonicalUrl, imageUrl }) {
  const published = toIsoDateTime(post.publishedAt || post.updatedAt);
  const modified = toIsoDateTime(post.updatedAt || post.publishedAt);
  const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: collapseMetaText(post.seoDescription || post.excerpt || ""),
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: published || undefined,
    dateModified: modified || published || undefined,
    ...(tags.length ? { articleSection: tags[0], keywords: tags.join(", ") } : {}),
    author: post.author
      ? { "@type": "Person", name: post.author }
      : {
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

function buildFAQPageJsonLd(faqItems) {
  const items = normalizeFaqItems(faqItems);
  if (!items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function buildDonateActionJsonLd(site) {
  const siteUrl = getSiteUrl(site);

  return {
    "@context": "https://schema.org",
    "@type": "DonateAction",
    name: `Donate to ${site.siteName}`,
    target: buildCanonicalUrl(site, "/donate/"),
    agent: {
      "@type": "Organization",
      name: site.siteName,
      url: siteUrl
    },
    recipient: {
      "@type": "NGO",
      name: site.siteName,
      url: siteUrl
    }
  };
}

function buildContactPageJsonLd({ site, canonicalUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${site.siteName}`,
    url: canonicalUrl,
    description: site.defaultSeoDescription,
    mainEntity: buildOrganizationJsonLd(site)
  };
}

function buildCollectionPageJsonLd({ site, canonicalUrl, name, description, items }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: canonicalUrl,
    description: collapseMetaText(description),
    isPartOf: {
      "@type": "WebSite",
      name: site.siteName,
      url: getSiteUrl(site)
    },
    hasPart: items.slice(0, 12).map((item) => ({
      "@type": "BlogPosting",
      headline: item.title,
      url: buildCanonicalUrl(site, `/stories/${item.slug}/`)
    }))
  };
}

function buildItemListJsonLd(site, posts) {
  if (!posts?.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: buildCanonicalUrl(site, `/stories/${post.slug}/`)
    }))
  };
}

function renderSeoHead({
  site,
  title,
  description,
  canonicalPath,
  ogImage,
  ogImageAlt,
  ogType = "website",
  keywords,
  articleMeta,
  structuredData = []
}) {
  const canonicalUrl = buildCanonicalUrl(site, canonicalPath);
  const metaDescription = collapseMetaText(description);
  const absoluteOgImage = ogImage ? toAbsoluteAssetUrl(site, ogImage) : "";
  const keywordMeta = keywords
    ? `\n    <meta name="keywords" content="${escapeHtml(keywords)}">`
    : "";
  const authorMeta =
    articleMeta?.author && ogType === "article"
      ? `\n    <meta name="author" content="${escapeHtml(articleMeta.author)}">`
      : "";
  const articleMetaTags =
    ogType === "article" && articleMeta
      ? [
          articleMeta.publishedTime
            ? `\n    <meta property="article:published_time" content="${escapeHtml(articleMeta.publishedTime)}">`
            : "",
          articleMeta.modifiedTime
            ? `\n    <meta property="article:modified_time" content="${escapeHtml(articleMeta.modifiedTime)}">`
            : "",
          articleMeta.section
            ? `\n    <meta property="article:section" content="${escapeHtml(articleMeta.section)}">`
            : "",
          articleMeta.author
            ? `\n    <meta property="article:author" content="${escapeHtml(articleMeta.author)}">`
            : ""
        ].join("")
      : "";
  const ogImageAltMeta =
    absoluteOgImage && ogImageAlt
      ? `\n    <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}">`
      : "";

  const openGraph = absoluteOgImage
    ? `
    <meta property="og:type" content="${escapeHtml(ogType)}">
    <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="en_US">
    <meta property="og:image" content="${escapeHtml(absoluteOgImage)}">${ogImageAltMeta}${articleMetaTags}
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
    <meta property="og:locale" content="en_US">${articleMetaTags}
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">`;

  return `
    <meta name="description" content="${escapeHtml(metaDescription)}">${keywordMeta}${authorMeta}
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
  resolveBlogPostSeo,
  normalizeFaqItems,
  renderFaqSection,
  renderSeoHead,
  renderJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildFAQPageJsonLd,
  buildDonateActionJsonLd,
  buildContactPageJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
  buildSitemapEntries,
  renderSitemapXml
};
