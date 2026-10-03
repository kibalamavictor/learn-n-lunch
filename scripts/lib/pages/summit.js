const { escapeHtml, resolveAsset, markdownToHtml, markdownInline } = require("../utils");
const { renderPage } = require("../partials");
const {
  resolvePageSeo,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd
} = require("../seo");

// Field names and option labels are matched by scripts/summit-applications.gs; update both together.
const FOOD_CHALLENGE_NONE = "I have not experienced or observed these challenges";

function renderChoiceChips({
  name,
  legend,
  options,
  required = false,
  multiple = false,
  hint = "",
  max = 0,
  exclusive = "",
  showWhen = ""
}) {
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

  const groupAttrs = [
    multiple ? `data-choice-group="${escapeHtml(name)}"` : "",
    multiple && required ? "data-required" : "",
    max ? `data-max="${max}"` : "",
    exclusive ? `data-exclusive="${escapeHtml(exclusive)}"` : "",
    showWhen ? `data-show-when="${escapeHtml(showWhen)}" hidden` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <fieldset class="lnl-summit__field${showWhen ? " lnl-summit__conditional" : ""}"${groupAttrs ? ` ${groupAttrs}` : ""}>
      <legend>${escapeHtml(legend)}${required ? " <span class=\"lnl-summit__req\">*</span>" : ""}</legend>
      ${hint ? `<p class="lnl-summit__hint">${escapeHtml(hint)}</p>` : ""}
      <div class="lnl-summit__chips">${chips}
      </div>
    </fieldset>`;
}

function renderMarkdownBlock(markdown, className) {
  return markdown ? `<div class="${className}">${markdownToHtml(markdown)}</div>` : "";
}

function renderUniversityPicker(universities = []) {
  const options = universities
    .map(
      (university, index) => `
          <li class="lnl-summit__option" id="summit-university-${index}" role="option" data-value="${escapeHtml(
            university.name
          )}" data-search="${escapeHtml([university.name, university.short, university.location].filter(Boolean).join(" "))}">
            <span>${escapeHtml(university.name)}</span>${
              university.location ? `<small>${escapeHtml(university.location)}</small>` : ""
            }
          </li>`
    )
    .join("");

  return `
    <div class="lnl-summit__field lnl-summit__combo" data-combobox>
      <label for="summit-university">University / institution <span class="lnl-summit__req">*</span></label>
      <p class="lnl-summit__hint" id="summit-university-hint">Start typing, then pick your university from the list.</p>
      <div class="lnl-summit__combo-control">
        <input class="form-input" id="summit-university" type="text" name="university" required autocomplete="off"
          role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="summit-university-list"
          aria-describedby="summit-university-hint" placeholder="e.g. Kyambogo, KIU, Makerere" data-combobox-input>
        <ul class="lnl-summit__listbox" id="summit-university-list" role="listbox" aria-label="Universities in Uganda" hidden data-combobox-list>${options}
          <li class="lnl-summit__option lnl-summit__option--custom" id="summit-university-custom" role="option" data-custom hidden>
            <span>My university isn't listed. Use "<strong data-custom-label></strong>"</span>
          </li>        </ul>
      </div>
    </div>`;
}

function renderSummit({ site, page, universities = [] }) {
  const depth = 1;
  const posterHref = resolveAsset(depth, page.posterPath || "ill-be-there/");
  const submitEmail = page.submitEmail || site.contact?.email || "info@learnandlunch.org";
  const submitEndpoint = page.submitEndpoint || "";
  const eventWhen = [page.eventDate, page.eventTime].filter(Boolean).join(" · ");

  const body = `
<section class="lnl-summit" id="summit-register" data-submit-email="${escapeHtml(submitEmail)}" data-submit-endpoint="${escapeHtml(submitEndpoint)}">
  <header class="lnl-summit__intro">
    <p class="lnl-summit__kicker">${escapeHtml(page.kicker)}</p>
    <h1>${escapeHtml(page.heading)}</h1>
    <p class="lnl-summit__tagline">${escapeHtml(page.tagline)}</p>
    <ul class="lnl-summit__meta-list">
      ${eventWhen ? `<li class="lnl-summit__meta">${escapeHtml(eventWhen)}</li>` : ""}
      ${page.eventVenue ? `<li class="lnl-summit__meta">${escapeHtml(page.eventVenue)}</li>` : ""}
      ${page.mealsNote ? `<li class="lnl-summit__meta lnl-summit__meta--meals">${escapeHtml(page.mealsNote)}</li>` : ""}
    </ul>
    ${renderMarkdownBlock(page.intro, "lnl-summit__lead")}
    <blockquote class="lnl-summit__quote"><strong>${escapeHtml(page.question)}</strong></blockquote>
    <p class="lnl-summit__promise"><strong>${escapeHtml(page.promise)}</strong></p>
    ${page.ctaPrompt ? `<p class="lnl-summit__cta-prompt">${escapeHtml(page.ctaPrompt)}</p>` : ""}
  </header>

  <form class="lnl-summit__form" data-summit-form novalidate>
    <h2 class="lnl-summit__section">1. About you</h2>
    <label class="lnl-summit__field">
      <span>Full name <span class="lnl-summit__req">*</span></span>
      <input class="form-input" type="text" name="fullName" autocomplete="name" required>
    </label>
    ${renderChoiceChips({
      name: "gender",
      legend: "Gender",
      options: ["Female", "Male", "Prefer not to say"]
    })}
    ${renderUniversityPicker(universities)}
    <label class="lnl-summit__field">
      <span>Course / programme <span class="lnl-summit__req">*</span></span>
      <input class="form-input" type="text" name="course" required>
    </label>

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

    <h2 class="lnl-summit__section">2. Your campus food experience</h2>
    <p class="lnl-summit__section-intro">We want the Summit to reflect what students are actually experiencing.</p>
    ${renderChoiceChips({
      name: "experiencedFoodChallenges",
      legend: "Have you personally experienced challenges accessing adequate or affordable food while at university?",
      options: ["Yes", "No", "Prefer not to say"],
      required: true
    })}

    ${renderChoiceChips({
      name: "campusFoodChallenges",
      legend: "What food-related challenges are common on your campus?",
      hint: "Select all that apply.",
      multiple: true,
      required: true,
      exclusive: FOOD_CHALLENGE_NONE,
      options: [
        "High food prices",
        "Limited affordable food options",
        "Limited nutritious food options",
        "Poor food quality",
        "Food safety or hygiene concerns",
        "Limited access to safe drinking water",
        "Financial difficulties affecting access to food",
        FOOD_CHALLENGE_NONE,
        "Other"
      ]
    })}

    <label class="lnl-summit__field lnl-summit__conditional" data-show-when="campusFoodChallenges=Other" hidden>
      <span>Other challenge</span>
      <input class="form-input" type="text" name="campusFoodChallengesOther" placeholder="Tell us briefly">
    </label>

    <label class="lnl-summit__field">
      <span>If you could change ONE thing about food on your campus, what would it be?</span>
      <input class="form-input" type="text" name="oneChange">
    </label>

    <h2 class="lnl-summit__section">3. Your participation</h2>
    ${renderChoiceChips({
      name: "studentLeader",
      legend: "Are you a student leader or part of a student club/association?",
      options: ["Yes", "No"],
      required: true
    })}

    <label class="lnl-summit__field lnl-summit__conditional" data-show-when="studentLeader=Yes" hidden>
      <span>Which Guild, student club/association or leadership structure?</span>
      <input class="form-input" type="text" name="leaderRole">
    </label>

    ${renderChoiceChips({
      name: "interests",
      legend: "What would you most like to engage with at the Summit?",
      hint: "Select up to 3.",
      multiple: true,
      required: true,
      max: 3,
      options: [
        "Student experiences and voices",
        "Food access and affordability",
        "Nutrition and healthy diets",
        "Research and evidence",
        "Practical campus solutions",
        "Student advocacy",
        "Policy and institutional change",
        "Innovation and entrepreneurship"
      ]
    })}

    <label class="lnl-summit__field">
      <span>What question would you most like university leaders and decision-makers to answer about student food security?</span>
      <textarea class="form-input lnl-summit__textarea" name="leaderQuestion" rows="2"></textarea>
    </label>

    <h2 class="lnl-summit__section">4. Beyond the Summit</h2>
    ${renderChoiceChips({
      name: "stayInvolved",
      legend: "Would you like to participate in campus food-security activities after the Summit?",
      options: ["Yes", "Maybe — tell me more", "Not at the moment"],
      required: true
    })}

    ${renderChoiceChips({
      name: "contribution",
      legend: "If yes or maybe, how would you be interested in contributing?",
      hint: "Select all that apply.",
      multiple: true,
      showWhen: "stayInvolved=Yes|Maybe — tell me more",
      options: [
        "Student dialogues and activities",
        "Mobilising other students",
        "Research and evidence gathering",
        "Student advocacy",
        "Communication and storytelling",
        "Developing practical solutions",
        "Through my Guild or student club/association",
        "I would like to learn more before deciding"
      ]
    })}

    <h2 class="lnl-summit__section">5. Consent</h2>
    <div class="checkbox-wrapper lnl-summit__consent">
      <input type="checkbox" id="summit-consent" class="custom-checkbox" name="consent" value="Yes" required>
      <label for="summit-consent" class="checkbox-label">${escapeHtml(page.consentLabel)} <span class="lnl-summit__req">*</span></label>
    </div>

    <input type="text" name="_gotcha" class="lnl-summit__honeypot" tabindex="-1" autocomplete="off">

    <div class="lnl-summit__before">
      <h3>${escapeHtml(page.beforeSubmitHeading || "Before you submit")}</h3>
      ${markdownToHtml(page.disclaimer)}
    </div>

    <button type="submit" class="lnl-summit__submit">${escapeHtml(page.submitLabel)}</button>
    <p class="lnl-summit__error" data-form-error role="alert"></p>
  </form>

  <div class="lnl-summit__success" data-success hidden>
    <p class="lnl-summit__kicker">Campus Food Security Summit 2026</p>
    <h2>${escapeHtml(page.successTitle)}</h2>
    <p>${escapeHtml(page.successBody)}</p>
    <a class="lnl-summit__submit" href="${posterHref}">${escapeHtml(page.posterCtaLabel)}</a>
    ${page.successNote ? `<p class="lnl-summit__note">${markdownInline(page.successNote)}</p>` : ""}
  </div>

  <p class="lnl-summit__convened"><strong>${escapeHtml(page.convenedBy)}</strong></p>
  ${page.closingLine ? `<p class="lnl-summit__closing">${escapeHtml(page.closingLine)}</p>` : ""}
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath: "/summit/",
    defaults: {
      title: `Student Registration | ${site.siteName}`,
      description: page.tagline,
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
