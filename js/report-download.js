(function initReportDownload() {
  const modal = document.getElementById("lnl-report-download");
  const triggers = document.querySelectorAll("[data-report-download]");
  if (!modal || !triggers.length || typeof modal.showModal !== "function") return;

  const form = modal.querySelector("[data-dl-form]");
  const success = modal.querySelector("[data-dl-success]");
  const successTitle = modal.querySelector("[data-dl-success-title]");
  const reportLabel = modal.querySelector("[data-dl-report]");
  const againLink = modal.querySelector("[data-dl-again]");
  const errorEl = modal.querySelector("[data-dl-error]");
  const submitBtn = form.querySelector("[type=submit]");
  const submitLabel = submitBtn.textContent;
  const submitEmail = modal.getAttribute("data-submit-email") || "info@learnandlunch.org";
  const submitEndpoint = (modal.getAttribute("data-submit-endpoint") || "").trim();
  const STORAGE_KEY = "lnl-report-lead";

  let activeTrigger = null;
  let submitting = false;

  function readLead() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function saveLead(lead) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
    } catch (error) {
      // Private browsing can block storage; the visitor just sees the form again next time.
    }
  }

  function setError(message) {
    errorEl.textContent = message || "";
  }

  function startDownload(href) {
    const link = document.createElement("a");
    link.href = href;
    link.download = "";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function postToSheet(payload) {
    // One request only. Apps Script writes on receive; a CORS retry would duplicate the row.
    await fetch(submitEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  }

  async function postToEmailFallback(payload) {
    const response = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(submitEmail), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        Object.assign(
          {
            _subject: "Report download — " + payload.report,
            _template: "table",
            _captcha: "false",
            _replyto: payload.email || ""
          },
          payload
        )
      )
    });
    const result = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error("Could not send download request.");
    }
  }

  function buildPayload(lead, trigger, returning) {
    return {
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      organization: lead.organization || "",
      email: lead.email || "",
      report: trigger.getAttribute("data-report-title") || "",
      returning: returning ? "Yes" : "No",
      page: window.location.pathname
    };
  }

  function openModal(trigger) {
    activeTrigger = trigger;
    reportLabel.textContent = trigger.getAttribute("data-report-title") || "report";
    form.hidden = false;
    success.hidden = true;
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = submitLabel;
    setError("");
    modal.showModal();
    const first = form.querySelector('input[name="firstName"]');
    if (first) first.focus();
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      const lead = readLead();
      if (lead && lead.email) {
        if (submitEndpoint) postToSheet(buildPayload(lead, trigger, true)).catch(function () {});
        return;
      }
      event.preventDefault();
      openModal(trigger);
    });
  });

  modal.querySelector("[data-dl-close]").addEventListener("click", function () {
    modal.close();
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) modal.close();
  });

  modal.addEventListener("close", function () {
    if (activeTrigger) activeTrigger.focus();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting || !activeTrigger) return;
    setError("");

    if (form.elements._gotcha && form.elements._gotcha.value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      setError("Please add your first name and a valid email.");
      return;
    }

    const data = new FormData(form);
    const lead = {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      organization: String(data.get("organization") || "").trim(),
      email: String(data.get("email") || "").trim()
    };

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const payload = buildPayload(lead, activeTrigger, false);
      if (submitEndpoint) {
        await postToSheet(payload);
      } else {
        await postToEmailFallback(payload);
      }
    } catch (error) {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
      setError("Something went wrong. Please try again or email " + submitEmail + ".");
      return;
    }

    saveLead(lead);
    const href = activeTrigger.getAttribute("href");
    againLink.setAttribute("href", href);
    form.hidden = true;
    form.reset();
    success.hidden = false;
    successTitle.focus();
    startDownload(href);
  });
})();
