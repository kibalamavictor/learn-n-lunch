(function initResearchStudy() {
  const root = document.getElementById("research-study");
  const form = root && root.querySelector("[data-study-form]");
  if (!root || !form) return;

  const studyId = root.getAttribute("data-study") || "study";
  const version = root.getAttribute("data-version") || "";
  const endpoint = (root.getAttribute("data-submit-endpoint") || "").trim();
  const consentRule = splitRule(root.getAttribute("data-consent"));
  const ageRule = splitRule(root.getAttribute("data-age"));
  const DRAFT_KEY = "lnl-study-draft:" + studyId;
  const DONE_KEY = "lnl-study-done:" + studyId;

  const intro = root.querySelector("[data-study-intro]");
  const repeatNotice = root.querySelector("[data-repeat-notice]");
  const steps = Array.from(form.querySelectorAll("[data-step]"));
  const progress = form.querySelector("[data-progress]");
  const progressStep = form.querySelector("[data-progress-step]");
  const progressTitle = form.querySelector("[data-progress-title]");
  const progressBar = form.querySelector("[data-progress-bar]");
  const progressFill = form.querySelector("[data-progress-fill]");
  const backBtn = form.querySelector("[data-back]");
  const nextBtn = form.querySelector("[data-next]");
  const submitBtn = form.querySelector("[data-submit]");
  const submitLabel = submitBtn ? submitBtn.textContent : "Submit questionnaire";
  const errorEl = form.querySelector("[data-form-error]");
  const success = root.querySelector("[data-success]");
  const screenOuts = Array.from(root.querySelectorAll("[data-screen-out]"));
  const conditionals = Array.from(form.querySelectorAll("[data-show-when]"));
  const choiceGroups = Array.from(form.querySelectorAll("[data-choice-group]"));

  let current = 0;
  let submitting = false;
  let responseId = newId();
  let startedAt = new Date().toISOString();
  let saveTimer = 0;

  function splitRule(rule) {
    const text = String(rule || "");
    const at = text.indexOf("=");
    return { name: text.slice(0, at), value: text.slice(at + 1) };
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function store(kind) {
    try {
      return kind === "local" ? window.localStorage : window.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function readJson(storage, key) {
    try {
      return storage ? JSON.parse(storage.getItem(key) || "null") : null;
    } catch (error) {
      return null;
    }
  }

  function setError(message) {
    if (errorEl) errorEl.textContent = message || "";
  }

  function inputsNamed(name) {
    return Array.from(form.querySelectorAll('input[name="' + name.replace(/"/g, '\\"') + '"]'));
  }

  function selectedValues(name) {
    return inputsNamed(name)
      .filter(function (input) {
        return input.checked;
      })
      .map(function (input) {
        return input.value;
      });
  }

  function syncChoice(input) {
    const targets = input.type === "radio" ? inputsNamed(input.name) : [input];
    targets.forEach(function (field) {
      const label = field.closest(".lnl-summit__chip, .lnl-study__cell");
      if (label) label.classList.toggle("is-selected", field.checked);
    });
  }

  function setConditional(container, show) {
    container.hidden = !show;
    container.querySelectorAll("input, textarea").forEach(function (field) {
      field.disabled = !show;
      if (!show) field.value = "";
    });
  }

  function updateConditionals() {
    conditionals.forEach(function (container) {
      const rule = splitRule(container.getAttribute("data-show-when"));
      const accepted = rule.value.split("|");
      const show = selectedValues(rule.name).some(function (value) {
        return accepted.indexOf(value) !== -1;
      });
      if (container.hidden === show) setConditional(container, show);
    });
  }

  function applyExclusive(group, changed) {
    const exclusive = group.getAttribute("data-exclusive");
    if (!exclusive || !changed || !changed.checked) return;
    group.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
      const clash = changed.value === exclusive ? input !== changed : input.value === exclusive;
      if (clash && input.checked) {
        input.checked = false;
        syncChoice(input);
      }
    });
  }

  function clearInvalid(container) {
    if (container) container.classList.remove("is-invalid");
  }

  /** Native validity plus rules the browser cannot express: blank text, checkbox groups, age range. */
  function refreshValidity(scope) {
    scope.querySelectorAll("[data-choice-group]").forEach(function (group) {
      const inputs = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      if (!inputs.length) return;
      const missing =
        group.hasAttribute("data-required") &&
        !inputs.some(function (input) {
          return input.checked;
        });
      inputs[0].setCustomValidity(missing ? "Please select at least one option." : "");
    });

    scope.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(function (field) {
      if (field.name === "_gotcha") return;
      field.setCustomValidity("");
      if (field.required && !field.disabled && !String(field.value).trim()) {
        field.setCustomValidity("Please fill in this field.");
      } else if (field.type === "number" && field.value !== "" && !field.checkValidity()) {
        field.setCustomValidity("Please enter your age in completed years (" + field.min + " to " + field.max + ").");
      }
    });
  }

  function validateStep(step) {
    refreshValidity(step);
    const invalid = Array.from(step.querySelectorAll("input, textarea")).filter(function (field) {
      return !field.disabled && field.name !== "_gotcha" && !field.checkValidity();
    });
    step.querySelectorAll(".is-invalid").forEach(clearInvalid);
    if (!invalid.length) {
      setError("");
      return true;
    }

    invalid.forEach(function (field) {
      const container = field.closest("[data-question]") || field.closest(".lnl-summit__field");
      if (container) container.classList.add("is-invalid");
    });
    const first = invalid[0];
    const target = first.closest("[data-question]") || first;
    setError(invalid.length === 1 ? "Please answer the highlighted question." : "Please answer the highlighted questions.");
    scrollToEl(target);
    first.focus({ preventScroll: true });
    if (first.type !== "radio" && first.type !== "checkbox") first.reportValidity();
    return false;
  }

  function scrollToEl(el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function goTo(index, focus) {
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach(function (step, i) {
      step.hidden = i !== current;
    });
    const step = steps[current];
    const pct = Math.round(((current + 1) / steps.length) * 100);
    if (progress) progress.hidden = false;
    if (progressStep) progressStep.textContent = "Section " + step.getAttribute("data-step") + " · " + (current + 1) + " of " + steps.length;
    if (progressTitle) progressTitle.textContent = step.getAttribute("data-step-title") || "";
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(pct));
    if (backBtn) backBtn.hidden = current === 0;
    if (nextBtn) nextBtn.hidden = current === steps.length - 1;
    if (submitBtn) submitBtn.hidden = current !== steps.length - 1;
    setError("");
    if (focus) {
      const heading = step.querySelector("h2");
      scrollToEl(form);
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    }
    saveDraft();
  }

  function showPanel(panel) {
    form.hidden = true;
    if (intro) intro.hidden = true;
    if (repeatNotice) repeatNotice.hidden = true;
    [success].concat(screenOuts).forEach(function (item) {
      if (item) item.hidden = item !== panel;
    });
    if (panel) {
      panel.hidden = false;
      scrollToEl(root);
      panel.focus({ preventScroll: true });
    }
  }

  function screenOut(reason) {
    clearDraft();
    showPanel(
      screenOuts.filter(function (panel) {
        return panel.getAttribute("data-screen-out") === reason;
      })[0]
    );
  }

  function eligibilityStop() {
    const consent = selectedValues(consentRule.name)[0];
    if (consent && consent !== consentRule.value) return "consent";
    const age = selectedValues(ageRule.name)[0];
    if (consent && age && age !== ageRule.value) return "age";
    return "";
  }

  function next() {
    if (current === 0) {
      const stop = eligibilityStop();
      if (stop) {
        screenOut(stop);
        return;
      }
    }
    if (!validateStep(steps[current])) return;
    goTo(current + 1, true);
  }

  function serialize() {
    const values = {};
    Array.from(form.elements).forEach(function (field) {
      if (!field.name || field.disabled || field.name === "_gotcha" || field.type === "submit" || field.type === "button") return;
      if (field.type === "checkbox") {
        if (!values[field.name]) values[field.name] = [];
        if (field.checked) values[field.name].push(field.value);
      } else if (field.type === "radio") {
        if (field.checked) values[field.name] = field.value;
      } else {
        values[field.name] = String(field.value).trim();
      }
    });
    return values;
  }

  function saveDraft() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () {
      const storage = store("session");
      if (!storage || submitting) return;
      try {
        storage.setItem(DRAFT_KEY, JSON.stringify({ responseId: responseId, startedAt: startedAt, step: current, values: serialize() }));
      } catch (error) {
        // Storage full or blocked; the form still works without drafts.
      }
    }, 250);
  }

  function clearDraft() {
    const storage = store("session");
    if (storage) storage.removeItem(DRAFT_KEY);
  }

  function restoreDraft() {
    const draft = readJson(store("session"), DRAFT_KEY);
    if (!draft || !draft.values) return 0;
    responseId = draft.responseId || responseId;
    startedAt = draft.startedAt || startedAt;
    Object.keys(draft.values).forEach(function (name) {
      const value = draft.values[name];
      const fields = Array.from(form.querySelectorAll('[name="' + name.replace(/"/g, '\\"') + '"]'));
      fields.forEach(function (field) {
        if (field.type === "checkbox") field.checked = Array.isArray(value) && value.indexOf(field.value) !== -1;
        else if (field.type === "radio") field.checked = field.value === value;
        else field.value = value;
      });
    });
    updateConditionals();
    form.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(syncChoice);
    return Math.max(0, Math.min(steps.length - 1, Number(draft.step) || 0));
  }

  async function send(payload) {
    // One request only; the sheet de-duplicates on responseId. Apps Script cold starts can take 30s+
    // and a no-cors response is opaque, so only wait long enough to catch an immediate network failure.
    // keepalive lets the write finish even if the tab is closed.
    const request = fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    await Promise.race([
      request,
      new Promise(function (resolve) {
        window.setTimeout(resolve, 1500);
      })
    ]);
  }

  form.addEventListener("change", function (event) {
    const field = event.target;
    if (!field || !field.name) return;
    if (field.type === "radio" || field.type === "checkbox") {
      const group = field.closest("[data-choice-group]");
      if (group) applyExclusive(group, field);
      syncChoice(field);
      updateConditionals();
    }
    clearInvalid(field.closest(".is-invalid"));
    saveDraft();
  });

  form.addEventListener("input", function (event) {
    clearInvalid(event.target.closest(".is-invalid"));
    saveDraft();
  });

  if (nextBtn) nextBtn.addEventListener("click", next);
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      goTo(current - 1, true);
    });
  }

  root.querySelectorAll("[data-change-answer]").forEach(function (button) {
    button.addEventListener("click", function () {
      screenOuts.forEach(function (panel) {
        panel.hidden = true;
      });
      form.hidden = false;
      if (intro) intro.hidden = false;
      goTo(0, true);
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting) return;
    if (current < steps.length - 1) {
      next();
      return;
    }
    if (form.querySelector('[name="_gotcha"]').value) return;

    const stop = eligibilityStop();
    if (stop) {
      screenOut(stop);
      return;
    }
    for (let i = 0; i < steps.length; i += 1) {
      if (!validateStep(steps[i])) {
        if (i !== current) {
          goTo(i, false);
          validateStep(steps[i]);
        }
        return;
      }
    }
    if (!endpoint) {
      setError("This questionnaire is not open for responses yet. Please check back soon.");
      return;
    }

    submitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }
    if (backBtn) backBtn.disabled = true;

    const payload = Object.assign(serialize(), {
      studyId: studyId,
      formVersion: version,
      responseId: responseId,
      startedAt: startedAt
    });

    try {
      await send(payload);
      clearDraft();
      if (local) local.setItem(DONE_KEY, new Date().toISOString());
      showPanel(success);
    } catch (error) {
      submitting = false;
      setError("Your answers could not be sent. Check your internet connection and press Submit again — nothing will be counted twice.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
      if (backBtn) backBtn.disabled = false;
    }
  });

  root.classList.add("is-enhanced");
  const local = store("local");
  if (repeatNotice && repeatNotice.textContent.trim() && local && local.getItem(DONE_KEY)) {
    repeatNotice.hidden = false;
  }
  conditionals.forEach(function (container) {
    setConditional(container, false);
  });
  goTo(restoreDraft(), false);
})();
