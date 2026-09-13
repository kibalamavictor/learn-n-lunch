const { escapeHtml, resolveAsset } = require("../utils");
const { renderPage } = require("../partials");
const {
  resolvePageSeo,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

function renderChoiceChips({ name, legend, options, required = false, multiple = false }) {
  const type = multiple ? "checkbox" : "radio";
  const chips = options
    .map(
      (option) => `
      <label class="lnl-summit__chip">
        <input type="${type}" name="${escapeHtml(name)}" value="${escapeHtml(option)}"${required && !multiple ? " required" : ""}>
        <span>${escapeHtml(option)}</span>
      </label>`
    )
    .join("");

  return `
    <fieldset class="lnl-summit__field">
      <legend>${escapeHtml(legend)}${required ? " <span class=\"lnl-summit__req\">*</span>" : ""}</legend>
      <div class="lnl-summit__chips">${chips}
      </div>
    </fieldset>`;
}

function renderSummit({ site, page }) {
  const depth = 1;
  const posterHref = resolveAsset(depth, page.posterPath || "ill-be-there/");
  const submitEmail = page.submitEmail || site.contact?.email || "info@learnandlunch.org";
  const submitEndpoint = page.submitEndpoint || "";

  const body = `
<section class="lnl-summit" id="summit-register" data-submit-email="${escapeHtml(submitEmail)}" data-submit-endpoint="${escapeHtml(submitEndpoint)}">
  <header class="lnl-summit__intro">
    <p class="lnl-summit__kicker">${escapeHtml(page.kicker)}</p>
    <h1>${escapeHtml(page.heading)}</h1>
    <p class="lnl-summit__tagline">${escapeHtml(page.tagline)}</p>
    <p class="lnl-summit__meta">${escapeHtml(page.eventDate)} · ${escapeHtml(page.eventVenue)}</p>
    <p class="lnl-summit__lead">${escapeHtml(page.intro)}</p>
    <blockquote class="lnl-summit__quote">${escapeHtml(page.question)}</blockquote>
    <p class="lnl-summit__promise">${escapeHtml(page.promise)}</p>
    ${page.ctaPrompt ? `<p class="lnl-summit__cta-prompt">${escapeHtml(page.ctaPrompt)}</p>` : ""}
  </header>

  <form class="lnl-summit__form" data-summit-form novalidate>
    <h2 class="lnl-summit__section">Your details</h2>
    <label class="lnl-summit__field">
      <span>Full name <span class="lnl-summit__req">*</span></span>
      <input class="form-input" type="text" name="fullName" autocomplete="name" required>
    </label>
    ${renderChoiceChips({
      name: "gender",
      legend: "Gender",
      options: ["Female", "Male", "Prefer not to say"]
    })}
    <div class="lnl-summit__grid">
      <label class="lnl-summit__field">
        <span>University / institution <span class="lnl-summit__req">*</span></span>
        <input class="form-input" type="text" name="university" required>
      </label>
      <label class="lnl-summit__field">
        <span>Course / programme <span class="lnl-summit__req">*</span></span>
        <input class="form-input" type="text" name="course" required>
      </label>
    </div>

    ${renderChoiceChips({
      name: "yearOfStudy",
      legend: "Year of study",
      options: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+", "Postgraduate", "Other"],
      required: true
    })}

    <div class="lnl-summit__grid">
      <label class="lnl-summit__field">
        <span>Phone number <span class="lnl-summit__req">*</span></span>
        <input class="form-input" type="tel" name="phone" autocomplete="tel" inputmode="tel" required>
      </label>
      <label class="lnl-summit__field">
        <span>Email address <span class="lnl-summit__req">*</span></span>
        <input class="form-input" type="email" name="email" autocomplete="email" required>
      </label>
    </div>

    <h2 class="lnl-summit__section">Your participation</h2>
    ${renderChoiceChips({
      name: "studentLeader",
      legend: "Are you a student leader or in a student organisation?",
      options: ["Yes", "No"]
    })}

    <label class="lnl-summit__field lnl-summit__conditional" data-leader-role hidden>
      <span>Your role / organisation</span>
      <input class="form-input" type="text" name="leaderRole" data-leader-input>
    </label>

    <label class="lnl-summit__field">
      <span>Why do you want to attend? <span class="lnl-summit__req">*</span></span>
      <textarea class="form-input lnl-summit__textarea" name="whyAttend" rows="2" required placeholder="1–2 sentences"></textarea>
    </label>

    ${renderChoiceChips({
      name: "witnessedFoodInsecurity",
      legend: "Have you experienced or witnessed campus food insecurity?",
      options: ["Yes", "No", "Prefer not to say"]
    })}

    ${renderChoiceChips({
      name: "interests",
      legend: "Which part interests you most? (select any)",
      multiple: true,
      options: [
        "Student experiences and voices",
        "Research and evidence",
        "Food and nutrition",
        "Practical solutions",
        "Student advocacy and action",
        "Policy and institutional change",
        "Innovation and entrepreneurship"
      ]
    })}

    <h2 class="lnl-summit__section">Stay involved</h2>
    ${renderChoiceChips({
      name: "stayInvolved",
      legend: "Would you join campus food security activities after the Summit?",
      options: ["Yes", "Maybe", "Not at the moment"]
    })}

    <div class="checkbox-wrapper lnl-summit__consent">
      <input type="checkbox" id="summit-consent" class="custom-checkbox" name="consent" value="Yes" required>
      <label for="summit-consent" class="checkbox-label">${escapeHtml(page.consentLabel)}</label>
    </div>

    <input type="text" name="_gotcha" class="lnl-summit__honeypot" tabindex="-1" autocomplete="off">

    <button type="submit" class="lnl-summit__submit">${escapeHtml(page.submitLabel)}</button>
    <p class="lnl-summit__note">${escapeHtml(page.disclaimer)}</p>
    <p class="lnl-summit__error" data-form-error role="alert"></p>
  </form>

  <div class="lnl-summit__success" data-success hidden>
    <p class="lnl-summit__kicker">Campus Food Security Summit 2026</p>
    <h2>${escapeHtml(page.successTitle)}</h2>
    <p>${escapeHtml(page.successBody)}</p>
    <a class="lnl-summit__submit" href="${posterHref}">${escapeHtml(page.posterCtaLabel)}</a>
    <p class="lnl-summit__note">${escapeHtml(page.disclaimer)}</p>
  </div>

  <p class="lnl-summit__convened">${escapeHtml(page.convenedBy)}</p>
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/summit/",
    defaults: {
      title: `Student Registration | ${site.siteName}`,
      description: page.intro,
      ogImage: page.ogImage || "/summit-poster/template.jpg",
      ogImageAlt: page.ogImageAlt,
      keywords: "Campus Food Security Summit, student registration, KIU, Ending Campus Hunger"
    }
  });

  return renderPage({
    site,
    depth,
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    ogImage: seo.ogImage,
    ogImageAlt: seo.ogImageAlt,
    keywords: seo.keywords,
    ogType: seo.ogType,
    structuredData: [
      buildOrganizationJsonLd(site),
      buildBreadcrumbJsonLd(site, [
        { name: "Home", path: "/" },
        { name: "Summit Registration", path: "/summit/" }
      ])
    ].filter(Boolean),
    activePath: "/summit",
    bodyClass: "lnl-summit-page",
    body,
    scripts: ["js/app.js", "js/summit-register.js"]
  });
}

module.exports = { renderSummit };
