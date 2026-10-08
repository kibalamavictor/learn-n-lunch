const { escapeHtml, markdownToHtml, markdownInline } = require("../utils");
const { renderPage } = require("../partials");
const { resolvePageSeo, buildOrganizationJsonLd } = require("../seo");

const REQ = ' <span class="lnl-summit__req">*</span>';

function code(question) {
  return `<span class="lnl-study__code">${escapeHtml(question.code || question.id)}</span>`;
}

function hint(text) {
  return text ? `<p class="lnl-summit__hint">${escapeHtml(text)}</p>` : "";
}

function chip(type, name, value, required, optionFor = "") {
  return `
        <label class="lnl-summit__chip"${optionFor ? ` data-option-for="${escapeHtml(optionFor)}"` : ""}>
          <input type="${type}" name="${escapeHtml(name)}" value="${escapeHtml(value)}"${required ? " required" : ""}>
          <span>${escapeHtml(value)}</span>
        </label>`;
}

function chips(question, type, required) {
  if (!question.optionsBy) {
    return question.options.map((option) => chip(type, question.id, option, required)).join("");
  }
  return Object.entries(question.optionsBy)
    .map(([parent, options]) =>
      options.map((option) => chip(type, question.id, option, required, `${question.dependsOn}=${parent}`)).join("")
    )
    .join("");
}

function conditionalText({ name, label, when, required, placeholder = "" }) {
  return `
    <label class="lnl-summit__field lnl-summit__conditional lnl-study__followup" data-show-when="${escapeHtml(when)}" hidden>
      <span>${escapeHtml(label)}${required ? REQ : ""}</span>
      <input class="form-input" type="text" name="${escapeHtml(name)}"${required ? " required" : ""}${
        placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""
      } disabled>
    </label>`;
}

function renderChoice(question) {
  const multiple = question.type === "checkbox";
  const type = multiple ? "checkbox" : "radio";
  const attrs = [
    `data-question="${escapeHtml(question.id)}"`,
    multiple ? `data-choice-group="${escapeHtml(question.id)}"` : "",
    multiple && question.required ? "data-required" : "",
    question.exclusive ? `data-exclusive="${escapeHtml(question.exclusive)}"` : ""
  ]
    .filter(Boolean)
    .join(" ");

  const list = multiple || question.optionsBy;
  const dependsHint = question.optionsBy
    ? `<p class="lnl-summit__hint lnl-study__depends-hint" data-depends-hint>${escapeHtml(question.dependsHint || "")}</p>`
    : "";

  const extras = [
    question.other
      ? conditionalText({
          name: `${question.id}_other`,
          label: "Please specify",
          when: `${question.id}=${question.other}`,
          required: true
        })
      : "",
    question.followUp
      ? conditionalText({
          name: question.followUp.id,
          label: question.followUp.text,
          when: `${question.id}=${question.followUp.when}`,
          required: question.followUp.required
        })
      : ""
  ].join("");

  return `
    <fieldset class="lnl-summit__field lnl-study__q${list ? " lnl-study__q--list" : ""}" ${attrs}>
      <legend>${code(question)} ${escapeHtml(question.text)}${question.required ? REQ : ""}</legend>
      ${hint(question.hint)}${dependsHint}
      <div class="lnl-summit__chips">${chips(question, type, question.required && !multiple)}
      </div>
    </fieldset>${extras}`;
}

function renderInput(question) {
  const required = question.required ? " required" : "";
  let control;
  if (question.type === "textarea") {
    control = `<textarea class="form-input lnl-summit__textarea" name="${escapeHtml(question.id)}" rows="2"${required}></textarea>`;
  } else if (question.type === "number") {
    control = `<input class="form-input lnl-study__number" type="number" name="${escapeHtml(question.id)}" inputmode="numeric" step="1" min="${
      question.min
    }" max="${question.max}"${required}>`;
  } else {
    control = `<input class="form-input" type="text" name="${escapeHtml(question.id)}"${required}>`;
  }

  return `
    <label class="lnl-summit__field lnl-study__q" data-question="${escapeHtml(question.id)}">
      <span>${code(question)} ${escapeHtml(question.text)}${question.required ? REQ : ""}</span>
      ${hint(question.hint)}
      ${control}
    </label>`;
}

function rowLabelId(row) {
  return `study-q-${row.id.replace(/[^A-Za-z0-9]+/g, "-")}`;
}

function renderMatrix(question) {
  const head = question.columns.map((column) => `<span>${escapeHtml(column)}</span>`).join("");
  const rows = question.rows
    .map(
      (row) => `
        <div class="lnl-study__row" role="radiogroup" aria-labelledby="${rowLabelId(row)}"${question.required ? ' aria-required="true"' : ""} data-question="${escapeHtml(row.id)}">
          <p class="lnl-study__row-label" id="${rowLabelId(row)}"><span class="lnl-study__code">${escapeHtml(row.id)}</span> ${escapeHtml(row.text)}${question.required ? REQ : ""}</p>
          <div class="lnl-study__cells">${question.columns
            .map(
              (column) => `
            <label class="lnl-study__cell">
              <input type="radio" name="${escapeHtml(row.id)}" value="${escapeHtml(column)}"${question.required ? " required" : ""}>
              <span>${escapeHtml(column)}</span>
            </label>`
            )
            .join("")}
          </div>
        </div>`
    )
    .join("");

  return `
    <div class="lnl-summit__field lnl-study__matrix" style="--cols: ${question.columns.length}" data-question="${escapeHtml(question.id)}">
      <p class="lnl-study__matrix-title">${code(question)} ${escapeHtml(question.text)}</p>
      ${question.prompt ? `<p class="lnl-study__matrix-prompt">${escapeHtml(question.prompt)}</p>` : ""}
      <div class="lnl-study__matrix-head" aria-hidden="true"><span></span>${head}</div>
      ${rows}
    </div>`;
}

function renderQuestion(question) {
  if (question.type === "matrix") return renderMatrix(question);
  if (question.type === "radio" || question.type === "checkbox") return renderChoice(question);
  return renderInput(question);
}

function renderStep(section, index, total, page) {
  const isLast = index === total - 1;
  return `
    <div class="lnl-study__step" data-step="${escapeHtml(section.id)}" data-step-title="${escapeHtml(section.title)}">
      <h2 class="lnl-summit__section"><span class="lnl-study__letter">${escapeHtml(section.id)}</span>${escapeHtml(section.title)}</h2>
      ${section.intro ? `<p class="lnl-study__section-intro">${escapeHtml(section.intro)}</p>` : ""}
      ${section.questions.map(renderQuestion).join("")}
      ${
        isLast && page.beforeSubmit
          ? `<div class="lnl-summit__before">
        <h3>${escapeHtml(page.beforeSubmitHeading || "Before you submit")}</h3>
        ${markdownToHtml(page.beforeSubmit)}
      </div>`
          : ""
      }
    </div>`;
}

function renderResearchStudy({ site, page, study, canonicalPath }) {
  const depth = 1;
  const meta = [page.audience, page.duration, page.privacyNote].filter(Boolean);
  const steps = study.sections.map((section, index) => renderStep(section, index, study.sections.length, page)).join("");

  const body = `
<section class="lnl-summit lnl-study" id="research-study"
  data-study="${escapeHtml(study.id)}" data-version="${escapeHtml(study.version)}"
  data-submit-endpoint="${escapeHtml(page.submitEndpoint || "")}"
  data-consent="${escapeHtml(study.consent.question)}=${escapeHtml(study.consent.yes)}"
  data-age="${escapeHtml(study.consent.ageQuestion)}=${escapeHtml(study.consent.ageYes)}">
  <header class="lnl-summit__intro" data-study-intro>
    <p class="lnl-summit__kicker">${escapeHtml(page.kicker)}</p>
    <h1>${escapeHtml(page.heading)}</h1>
    <p class="lnl-summit__tagline">${escapeHtml(page.tagline)}</p>
    ${
      meta.length
        ? `<ul class="lnl-summit__meta-list">${meta
            .map((item, index) => `<li class="lnl-summit__meta lnl-study__meta--${index + 1}">${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        : ""
    }
    ${page.intro ? `<div class="lnl-summit__lead">${markdownToHtml(page.intro)}</div>` : ""}
  </header>

  <p class="lnl-study__notice" data-repeat-notice hidden>${escapeHtml(page.repeatNotice || "")}</p>
  <noscript><p class="lnl-study__notice">Please enable JavaScript to complete this questionnaire.</p></noscript>

  <form class="lnl-summit__form lnl-study__form" data-study-form novalidate>
    <div class="lnl-study__progress" data-progress hidden>
      <p class="lnl-study__progress-label"><span data-progress-step></span><span data-progress-title></span></p>
      <div class="lnl-study__bar" role="progressbar" aria-label="Questionnaire progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-progress-bar><span data-progress-fill></span></div>
    </div>
    ${steps}
    <input type="text" name="_gotcha" class="lnl-summit__honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
    <p class="lnl-summit__error" data-form-error role="alert"></p>
    <div class="lnl-study__nav">
      <button type="button" class="lnl-study__back" data-back hidden>Back</button>
      <button type="button" class="lnl-summit__submit lnl-study__next" data-next hidden>Next section</button>
      <button type="submit" class="lnl-summit__submit" data-submit>${escapeHtml(page.submitLabel || "Submit questionnaire")}</button>
    </div>
  </form>

  <div class="lnl-summit__success lnl-study__end" data-success tabindex="-1" hidden>
    <p class="lnl-summit__kicker">${escapeHtml(page.kicker)}</p>
    <h2>${escapeHtml(page.successTitle)}</h2>
    ${page.successBody ? `<p>${markdownInline(page.successBody)}</p>` : ""}
  </div>

  <div class="lnl-summit__success lnl-study__end" data-screen-out="consent" tabindex="-1" hidden>
    <p class="lnl-summit__kicker">${escapeHtml(page.kicker)}</p>
    <h2>${escapeHtml(page.declinedTitle)}</h2>
    <p>${markdownInline(page.declinedBody)}</p>
    <button type="button" class="lnl-study__back" data-change-answer>Change my answer</button>
  </div>

  <div class="lnl-summit__success lnl-study__end" data-screen-out="age" tabindex="-1" hidden>
    <p class="lnl-summit__kicker">${escapeHtml(page.kicker)}</p>
    <h2>${escapeHtml(page.ineligibleTitle)}</h2>
    <p>${markdownInline(page.ineligibleBody)}</p>
    <button type="button" class="lnl-study__back" data-change-answer>Change my answer</button>
  </div>

  ${page.conductedBy ? `<p class="lnl-summit__convened"><strong>${escapeHtml(page.conductedBy)}</strong></p>` : ""}
</section>`;

  const seo = resolvePageSeo({
    site,
    page,
    canonicalPath,
    defaults: {
      title: `${page.heading} | ${site.siteName}`,
      description: page.tagline,
      ogImage: page.ogImage || site.defaultOgImage,
      ogImageAlt: page.ogImageAlt
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
    robots: "noindex, nofollow",
    structuredData: [buildOrganizationJsonLd(site)].filter(Boolean),
    activePath: canonicalPath.replace(/\/$/, ""),
    bodyClass: "lnl-summit-page lnl-study-page",
    body,
    scripts: ["js/app.js", "js/research-study.js"]
  });
}

module.exports = { renderResearchStudy };
