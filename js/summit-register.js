(function initSummitRegister() {
  const root = document.getElementById("summit-register");
  const form = root && root.querySelector("[data-summit-form]");
  if (!root || !form) return;

  const success = root.querySelector("[data-success]");
  const errorEl = root.querySelector("[data-form-error]");
  const conditionals = Array.from(form.querySelectorAll("[data-show-when]"));
  const choiceGroups = Array.from(form.querySelectorAll("[data-choice-group]"));
  const submitBtn = form.querySelector("[type=submit]");
  const submitLabel = submitBtn ? submitBtn.textContent : "Submit registration";
  const submitEmail = root.getAttribute("data-submit-email") || "info@learnandlunch.org";
  const submitEndpoint = (root.getAttribute("data-submit-endpoint") || "").trim();

  function setError(message) {
    if (errorEl) errorEl.textContent = message || "";
  }

  function syncChipState(input) {
    const chip = input.closest(".lnl-summit__chip");
    if (!chip) return;
    if (input.type === "radio") {
      const group = chip.parentElement;
      if (!group) return;
      group.querySelectorAll(".lnl-summit__chip").forEach(function (item) {
        const field = item.querySelector("input");
        const on = Boolean(field && field.checked);
        item.classList.toggle("is-selected", on);
        item.classList.toggle("selected", on);
      });
      return;
    }
    chip.classList.toggle("is-selected", input.checked);
    chip.classList.toggle("selected", input.checked);
  }

  function groupInputs(group) {
    return Array.from(group.querySelectorAll('input[type="checkbox"]'));
  }

  function selectedValues(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function clearFields(container) {
    container.querySelectorAll("input, textarea").forEach(function (field) {
      if (field.type === "checkbox" || field.type === "radio") {
        if (field.checked) {
          field.checked = false;
          syncChipState(field);
        }
        field.disabled = false;
      } else {
        field.value = "";
      }
    });
  }

  function updateConditionals() {
    conditionals.forEach(function (container) {
      const rule = container.getAttribute("data-show-when") || "";
      const separator = rule.indexOf("=");
      const name = rule.slice(0, separator);
      const accepted = rule.slice(separator + 1).split("|");
      const show = selectedValues(name).some(function (value) {
        return accepted.indexOf(value) !== -1;
      });
      if (container.hidden === !show) return;
      container.hidden = !show;
      if (!show) clearFields(container);
    });
  }

  function applyGroupRules(group, changed) {
    const inputs = groupInputs(group);
    const exclusive = group.getAttribute("data-exclusive");
    const max = Number(group.getAttribute("data-max")) || 0;

    if (exclusive && changed && changed.checked) {
      inputs.forEach(function (input) {
        const clash = changed.value === exclusive ? input !== changed : input.value === exclusive;
        if (clash && input.checked) {
          input.checked = false;
          syncChipState(input);
        }
      });
    }

    if (max) {
      const full = inputs.filter(function (input) {
        return input.checked;
      }).length >= max;
      inputs.forEach(function (input) {
        input.disabled = full && !input.checked;
      });
    }
  }

  function validateChoiceGroups() {
    choiceGroups.forEach(function (group) {
      const inputs = groupInputs(group);
      if (!inputs.length) return;
      const missing =
        group.hasAttribute("data-required") &&
        !group.closest("[hidden]") &&
        !inputs.some(function (input) {
          return input.checked;
        });
      inputs[0].setCustomValidity(missing ? "Please select at least one option." : "");
    });
  }

  function normalizeSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function initCombobox(container) {
    const input = container.querySelector("[data-combobox-input]");
    const list = container.querySelector("[data-combobox-list]");
    if (!input || !list) return null;

    const options = Array.from(list.querySelectorAll("[data-value]")).map(function (element) {
      return {
        element: element,
        value: element.getAttribute("data-value"),
        key: normalizeSearch(element.getAttribute("data-value")),
        search: " " + normalizeSearch(element.getAttribute("data-search"))
      };
    });
    const customOption = list.querySelector("[data-custom]");
    const customLabel = list.querySelector("[data-custom-label]");
    let visible = [];
    let activeIndex = -1;

    function exactMatch(value) {
      const key = normalizeSearch(value);
      return options.find(function (option) {
        return option.key === key;
      });
    }

    function setActive(index) {
      visible.forEach(function (element, i) {
        element.classList.toggle("is-active", i === index);
        element.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      activeIndex = index;
      if (index >= 0 && visible[index]) {
        input.setAttribute("aria-activedescendant", visible[index].id);
        visible[index].scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function open() {
      const query = normalizeSearch(input.value);
      const tokens = query ? query.split(" ") : [];
      visible = [];
      options.forEach(function (option) {
        const show = tokens.every(function (token) {
          return option.search.indexOf(" " + token) !== -1;
        });
        option.element.hidden = !show;
        if (show) visible.push(option.element);
      });

      const showCustom = Boolean(query) && !exactMatch(input.value);
      if (customOption) {
        customOption.hidden = !showCustom;
        if (customLabel) customLabel.textContent = input.value.trim();
        if (showCustom) visible.push(customOption);
      }

      list.hidden = visible.length === 0;
      input.setAttribute("aria-expanded", list.hidden ? "false" : "true");
      setActive(visible.length && query ? 0 : -1);
    }

    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      setActive(-1);
    }

    function choose(element) {
      if (!element) return;
      if (element === customOption) {
        input.value = input.value.trim();
        input.dataset.picked = "custom";
      } else {
        input.value = element.getAttribute("data-value");
        input.dataset.picked = "list";
      }
      input.setCustomValidity("");
      close();
    }

    function validate() {
      const value = input.value.trim();
      const match = exactMatch(value);
      if (match && !input.dataset.picked) {
        input.value = match.value;
        input.dataset.picked = "list";
      }
      const ok = !value || Boolean(input.dataset.picked);
      input.setCustomValidity(
        ok ? "" : "Please pick your university from the list, or choose \"My university isn't listed\"."
      );
      return ok;
    }

    input.addEventListener("input", function () {
      delete input.dataset.picked;
      input.setCustomValidity("");
      open();
    });
    input.addEventListener("focus", open);
    input.addEventListener("blur", function () {
      window.setTimeout(function () {
        close();
        validate();
      }, 150);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) open();
        if (!visible.length) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((activeIndex + step + visible.length) % visible.length);
      } else if (event.key === "Enter" && !list.hidden && activeIndex >= 0) {
        event.preventDefault();
        choose(visible[activeIndex]);
      } else if (event.key === "Escape") {
        close();
      }
    });
    list.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    list.addEventListener("click", function (event) {
      choose(event.target.closest('[role="option"]'));
    });

    return { validate: validate };
  }

  const universityPicker = initCombobox(form.querySelector("[data-combobox]") || form);

  function payloadFromForm() {
    const data = new FormData(form);
    const text = function (name) {
      return String(data.get(name) || "").trim();
    };
    const list = function (name) {
      return data.getAll(name).filter(Boolean).join(", ");
    };
    return {
      fullName: text("fullName"),
      gender: text("gender"),
      university: text("university"),
      course: text("course"),
      yearOfStudy: text("yearOfStudy"),
      phone: text("phone"),
      email: text("email"),
      experiencedFoodChallenges: text("experiencedFoodChallenges"),
      campusFoodChallenges: list("campusFoodChallenges"),
      campusFoodChallengesOther: text("campusFoodChallengesOther"),
      oneChange: text("oneChange"),
      studentLeader: text("studentLeader"),
      leaderRole: text("leaderRole"),
      interests: list("interests"),
      leaderQuestion: text("leaderQuestion"),
      stayInvolved: text("stayInvolved"),
      contribution: list("contribution"),
      consent: data.get("consent") ? "Yes" : "No"
    };
  }

  function showSuccess() {
    form.hidden = true;
    const intro = root.querySelector(".lnl-summit__intro");
    if (intro) intro.hidden = true;
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function postToSheet(payload) {
    // One request only. Apps Script writes on receive; a CORS retry would duplicate the row.
    // Apps Script cold starts can take 30s+, and a no-cors response is opaque anyway, so only
    // wait long enough to catch an immediate network failure. keepalive lets the write finish
    // even if the student closes the tab.
    const request = fetch(submitEndpoint, {
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

  async function postToEmailFallback(payload) {
    const response = await fetch(
      "https://formsubmit.co/ajax/" + encodeURIComponent(submitEmail),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(
          Object.assign(
            {
              _subject: "Campus Food Security Summit 2026 — student registration",
              _template: "table",
              _captcha: "false",
              _replyto: payload.email || ""
            },
            payload
          )
        )
      }
    );
    const result = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error("Could not send registration.");
    }
  }

  form.querySelectorAll(".lnl-summit__chip input").forEach(function (input) {
    syncChipState(input);
    input.addEventListener("change", function () {
      const group = input.closest("[data-choice-group]");
      if (group) applyGroupRules(group, input);
      syncChipState(input);
      updateConditionals();
      validateChoiceGroups();
    });
  });
  choiceGroups.forEach(function (group) {
    applyGroupRules(group, null);
  });
  updateConditionals();

  let submitting = false;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) {
      return;
    }

    validateChoiceGroups();
    if (universityPicker) universityPicker.validate();
    if (!form.checkValidity()) {
      form.reportValidity();
      setError("Please complete the required fields.");
      return;
    }

    submitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const payload = payloadFromForm();
      if (submitEndpoint) {
        await postToSheet(payload);
      } else {
        await postToEmailFallback(payload);
      }
      showSuccess();
    } catch (error) {
      submitting = false;
      setError("Something went wrong. Please try again or email " + submitEmail + ".");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  });
})();
