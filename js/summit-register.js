(function initSummitRegister() {
  const root = document.getElementById("summit-register");
  const form = root && root.querySelector("[data-summit-form]");
  if (!root || !form) return;

  const success = root.querySelector("[data-success]");
  const errorEl = root.querySelector("[data-form-error]");
  const leaderWrap = root.querySelector("[data-leader-role]");
  const leaderInput = root.querySelector("[data-leader-input]");
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

  function updateLeaderField() {
    const selected = form.querySelector('input[name="studentLeader"]:checked');
    const show = selected && selected.value === "Yes";
    if (leaderWrap) leaderWrap.hidden = !show;
    if (leaderInput) {
      leaderInput.required = Boolean(show);
      if (!show) leaderInput.value = "";
    }
  }

  function payloadFromForm() {
    const data = new FormData(form);
    const interests = data.getAll("interests").filter(Boolean);
    return {
      fullName: data.get("fullName") || "",
      gender: data.get("gender") || "",
      university: data.get("university") || "",
      course: data.get("course") || "",
      yearOfStudy: data.get("yearOfStudy") || "",
      phone: data.get("phone") || "",
      email: data.get("email") || "",
      studentLeader: data.get("studentLeader") || "",
      leaderRole: data.get("leaderRole") || "",
      whyAttend: data.get("whyAttend") || "",
      witnessedFoodInsecurity: data.get("witnessedFoodInsecurity") || "",
      interests: interests.join(", "),
      stayInvolved: data.get("stayInvolved") || "",
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
    const response = await fetch(submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    const result = await response.text().then(function (text) {
      try {
        return JSON.parse(text);
      } catch (error) {
        return { ok: response.ok, raw: text };
      }
    });
    if (!response.ok || result.ok === false) {
      throw new Error("Sheet request failed");
    }
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
      syncChipState(input);
      if (input.name === "studentLeader") updateLeaderField();
    });
  });
  updateLeaderField();

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    setError("");

    if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      setError("Please complete the required fields.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const payload = payloadFromForm();
      if (submitEndpoint) {
        try {
          await postToSheet(payload);
        } catch (sheetError) {
          await fetch(submitEndpoint, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          });
        }
      } else {
        await postToEmailFallback(payload);
      }
      showSuccess();
    } catch (error) {
      setError("Something went wrong. Please try again or email " + submitEmail + ".");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  });
})();
