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
  const fileCache = {};

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

  function failureMessage() {
    return "We couldn't prepare the PDF. Please try again or email " + submitEmail + ".";
  }

  function startDownload(file) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function buildPayload(lead, trigger, returning) {
    return {
      reportKey: trigger.getAttribute("data-report-key") || "",
      report: trigger.getAttribute("data-report-title") || "",
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      organization: lead.organization || "",
      email: lead.email || "",
      returning: returning ? "Yes" : "No",
      page: window.location.pathname
    };
  }

  async function fetchReport(lead, trigger, returning) {
    const key = trigger.getAttribute("data-report-key");
    if (fileCache[key]) return fileCache[key];
    if (!submitEndpoint) throw new Error("Download endpoint is not configured.");

    // One request only. Apps Script writes on receive; a retry would duplicate the row.
    const response = await fetch(submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(buildPayload(lead, trigger, returning))
    });
    const result = await response.json();
    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error || "Download failed.");
    }

    const binary = atob(result.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: result.mimeType || "application/pdf" });

    fileCache[key] = {
      url: URL.createObjectURL(blob),
      fileName: result.fileName || (trigger.getAttribute("data-report-title") || "report") + ".pdf"
    };
    return fileCache[key];
  }

  function openModal(trigger, lead, message) {
    activeTrigger = trigger;
    reportLabel.textContent = trigger.getAttribute("data-report-title") || "report";
    form.hidden = false;
    success.hidden = true;
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = submitLabel;
    if (lead) {
      ["firstName", "lastName", "organization", "email"].forEach(function (name) {
        if (form.elements[name]) form.elements[name].value = lead[name] || "";
      });
    }
    setError(message || "");
    modal.showModal();
    const first = form.querySelector('input[name="firstName"]');
    if (first) first.focus();
  }

  async function downloadForReturningVisitor(trigger, lead) {
    const label = trigger.querySelector("span") || trigger;
    const original = label.textContent;
    trigger.disabled = true;
    trigger.setAttribute("aria-busy", "true");
    label.textContent = "Preparing…";

    try {
      startDownload(await fetchReport(lead, trigger, true));
    } catch (error) {
      openModal(trigger, lead, failureMessage());
    } finally {
      trigger.disabled = false;
      trigger.removeAttribute("aria-busy");
      label.textContent = original;
    }
  }

  function handleTrigger(trigger) {
    const lead = readLead();
    if (lead && lead.email) {
      downloadForReturningVisitor(trigger, lead);
      return;
    }
    openModal(trigger);
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      handleTrigger(trigger);
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
    submitBtn.textContent = "Preparing your PDF…";

    let file;
    try {
      file = await fetchReport(lead, activeTrigger, false);
    } catch (error) {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
      setError(failureMessage());
      return;
    }

    saveLead(lead);
    againLink.setAttribute("href", file.url);
    againLink.setAttribute("download", file.fileName);
    form.hidden = true;
    form.reset();
    success.hidden = false;
    successTitle.focus();
    startDownload(file);
  });

  const requested = new URLSearchParams(window.location.search).get("download");
  if (requested) {
    const trigger = document.querySelector('[data-report-download][data-report-key="' + CSS.escape(requested) + '"]');
    if (trigger) {
      trigger.scrollIntoView({ block: "center" });
      handleTrigger(trigger);
    }
  }
})();
