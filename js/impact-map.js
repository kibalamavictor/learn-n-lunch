(function initImpactMap() {
  const dataEl = document.getElementById("lnlImpactMapData");
  const frame = document.getElementById("lnlMapFrame");
  if (!dataEl || !frame) return;

  (function initMarkerStrokeDraw() {
    const marker = document.querySelector(".lnl-marker-stroke");
    const path = marker?.querySelector("path");
    if (!marker || !path || typeof path.getTotalLength !== "function") return;

    const length = Math.ceil(path.getTotalLength()) + 1;
    path.style.setProperty("--marker-len", String(length));
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    marker.classList.add("is-ready");
  })();

  let CAMPUSES = [];
  let CLUSTER = { ids: [], x: 55.5, y: 63.0 };

  try {
    const parsed = JSON.parse(dataEl.textContent || "{}");
    CAMPUSES = parsed.campuses || [];
    CLUSTER = parsed.cluster || CLUSTER;
    CLUSTER.ids = (CLUSTER.ids || [])
      .map(function (entry) {
        if (typeof entry === "string") return entry;
        return entry.id || entry.campusId || "";
      })
      .filter(Boolean);
  } catch (err) {
    return;
  }

  if (!CAMPUSES.length) return;

  const MOBILE_CLUSTER_MAX = 600;

  function usesDesktopPinSpread() {
    return window.innerWidth > MOBILE_CLUSTER_MAX;
  }

  function getDesktopOffset(campus) {
    return campus.desktopOffset || campus.pinDesktopOffset;
  }

  function getCampusCoords(campus) {
    if (!usesDesktopPinSpread()) {
      return { x: campus.x, y: campus.y };
    }

    if (
      campus.pinDesktop &&
      typeof campus.pinDesktop.x === "number" &&
      typeof campus.pinDesktop.y === "number"
    ) {
      return { x: campus.pinDesktop.x, y: campus.pinDesktop.y };
    }

    const offset = getDesktopOffset(campus);
    if (offset) {
      return {
        x: campus.x + (Number(offset.x) || 0),
        y: campus.y + (Number(offset.y) || 0)
      };
    }

    return { x: campus.x, y: campus.y };
  }

  function applyCampusPosition(el, campus) {
    const coords = getCampusCoords(campus);
    el.style.left = coords.x + "%";
    el.style.top = coords.y + "%";
  }

  function updateAllCampusPositions() {
    CAMPUSES.forEach(function (campus) {
      const pin = document.getElementById("pin-" + campus.id);
      const sign = document.getElementById("sign-" + campus.id);
      if (pin) {
        applyCampusPosition(pin, campus);
      }
      if (sign) {
        applyCampusPosition(sign, campus);
      }
    });
  }

  let active = CAMPUSES[0].id;

  CAMPUSES.forEach(function (c) {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "lnl-pin" + (c.status === "soon" ? " is-soon" : "");
    applyCampusPosition(pin, c);
    pin.id = "pin-" + c.id;
    pin.setAttribute("aria-label", c.name + (c.status === "soon" ? " (expanding soon)" : ""));
    pin.addEventListener("click", function () {
      select(c.id);
    });
    pin.addEventListener("mouseenter", function () {
      showSign(c.id, true);
    });
    pin.addEventListener("mouseleave", function () {
      showSign(c.id, false);
    });
    pin.addEventListener("focus", function () {
      showSign(c.id, true);
    });
    pin.addEventListener("blur", function () {
      showSign(c.id, false);
    });
    frame.appendChild(pin);

    const sign = document.createElement("div");
    sign.className =
      "lnl-signpost" +
      (c.labelDir === "flip" ? " flip" : c.labelDir === "below" ? " below" : "");
    sign.id = "sign-" + c.id;
    applyCampusPosition(sign, c);
    if (c.status === "soon") {
      sign.classList.add("is-soon-sign");
    }
    sign.innerHTML =
      '<div class="lnl-signpost__label" tabindex="0" role="button" aria-label="' +
      c.name +
      ' — click for impact report" aria-expanded="false">' +
      (c.abbr || c.name) +
      "</div>" +
      '<div class="lnl-signpost__report" role="tooltip">' +
      '<button type="button" class="lnl-signpost__close" aria-label="Close impact report">&times;</button>' +
      "<p><b>" +
      c.name +
      "</b><br>" +
      (c.report || c.blurb) +
      "</p>" +
      '<div class="lnl-signpost__figures">' +
      "<div><b>" +
      c.statA.value +
      "</b><span>" +
      c.statA.label +
      "</span></div>" +
      "<div><b>" +
      c.statB.value +
      "</b><span>" +
      c.statB.label +
      "</span></div>" +
      "</div>" +
      "</div>";

    sign.addEventListener("mouseenter", function () {
      sign.classList.add("is-visible");
    });
    sign.addEventListener("mouseleave", function () {
      if (c.id !== active) {
        sign.classList.remove("is-visible");
      }
    });

    const label = sign.querySelector(".lnl-signpost__label");
    label.addEventListener("mouseenter", function () {
      keepReportInView(sign);
    });
    label.addEventListener("click", function () {
      toggleReport(c.id);
    });
    label.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleReport(c.id);
      }
    });

    const closeBtn = sign.querySelector(".lnl-signpost__close");
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (c.id === active) {
        setReportOpen(false);
      }
      sign.classList.add("is-suppressed");
    });
    sign.addEventListener("mouseleave", function () {
      sign.classList.remove("is-suppressed");
    });
    frame.appendChild(sign);
  });

  function keepReportInView(sign) {
    const report = sign.querySelector(".lnl-signpost__report");
    if (!report) return;
    report.style.marginLeft = "0px";
    requestAnimationFrame(function () {
      const rect = report.getBoundingClientRect();
      const margin = 12;
      const overflowRight = rect.right - (window.innerWidth - margin);
      const overflowLeft = margin - rect.left;
      if (overflowRight > 0) {
        report.style.marginLeft = -overflowRight + "px";
      } else if (overflowLeft > 0) {
        report.style.marginLeft = overflowLeft + "px";
      }
    });
  }

  const hideTimers = {};
  let reportOpen = false;

  function showSign(id, on) {
    const el = document.getElementById("sign-" + id);
    if (!el) return;
    if (on || id === active) {
      clearTimeout(hideTimers[id]);
      el.classList.add("is-visible");
      keepReportInView(el);
    } else {
      clearTimeout(hideTimers[id]);
      hideTimers[id] = setTimeout(function () {
        if (id !== active && !el.matches(":hover")) {
          el.classList.remove("is-visible");
        }
      }, 250);
    }
  }

  function setReportOpen(open) {
    reportOpen = open;
    const el = document.getElementById("sign-" + active);
    if (!el) return;
    const label = el.querySelector(".lnl-signpost__label");
    el.classList.toggle("report-open", reportOpen);
    label.setAttribute("aria-expanded", reportOpen ? "true" : "false");
    if (reportOpen) {
      keepReportInView(el);
    }
  }

  function toggleReport(id) {
    if (id !== active) {
      select(id);
      setReportOpen(true);
    } else {
      setReportOpen(!reportOpen);
    }
  }

  let closeClusterReport = function () {};
  let hideCluster = function () {};

  function select(id) {
    active = id;
    closeClusterReport();
    hideCluster();

    CAMPUSES.forEach(function (x) {
      document.getElementById("pin-" + x.id).classList.toggle("is-active", x.id === id);
      document.getElementById("sign-" + x.id).classList.toggle("is-visible", x.id === id);
      document.getElementById("sign-" + x.id).classList.toggle("is-selected", x.id === id);
      if (x.id !== id) {
        const signEl = document.getElementById("sign-" + x.id);
        signEl.classList.remove("report-open");
        signEl.querySelector(".lnl-signpost__label").setAttribute("aria-expanded", "false");
      }
    });
    reportOpen = false;
    const activeSign = document.getElementById("sign-" + id);
    activeSign.classList.remove("report-open");
    activeSign.querySelector(".lnl-signpost__label").setAttribute("aria-expanded", "false");
  }

  select(active);

  (function buildCluster() {
    const members = CAMPUSES.filter(function (c) {
      return CLUSTER.ids.indexOf(c.id) !== -1;
    });
    if (members.length < 2) return;

    members.forEach(function (c) {
      document.getElementById("pin-" + c.id).classList.add("lnl-in-cluster");
      document.getElementById("sign-" + c.id).classList.add("lnl-in-cluster");
    });

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "lnl-pin lnl-cluster-pin";
    pin.style.left = CLUSTER.x + "%";
    pin.style.top = CLUSTER.y + "%";
    pin.style.transform = "translate(-50%,-50%)";
    pin.style.padding = "0";
    pin.style.width = "";
    pin.setAttribute("aria-label", "Kampala-area campuses");
    pin.addEventListener("click", function () {
      showCluster();
    });
    frame.appendChild(pin);

    const cluster = document.createElement("div");
    cluster.className = "lnl-cluster";
    cluster.style.left = CLUSTER.x + "%";
    cluster.style.top = CLUSTER.y - 1.2 + "%";

    const stack = document.createElement("div");
    stack.className = "lnl-cluster__stack";
    members.forEach(function (c) {
      const b = document.createElement("div");
      b.className = "lnl-cluster__label";
      b.setAttribute("tabindex", "0");
      b.setAttribute("role", "button");
      b.setAttribute("aria-label", c.name + " — tap for impact report");
      b.setAttribute("aria-expanded", "false");
      b.textContent = c.abbr || c.name;
      b.addEventListener("mouseenter", function () {
        if (openId !== c.id) {
          openClusterReport(c, b);
        }
      });
      b.addEventListener("click", function () {
        openClusterReport(c, b);
      });
      b.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openClusterReport(c, b);
        }
      });
      stack.appendChild(b);
    });
    cluster.appendChild(stack);

    const report = document.createElement("div");
    report.className = "lnl-cluster__report";
    report.setAttribute("role", "tooltip");
    cluster.appendChild(report);
    frame.appendChild(cluster);

    let openId = null;
    const boards = stack.querySelectorAll(".lnl-cluster__label");

    function closeAllBoards() {
      openId = null;
      cluster.classList.remove("report-open");
      boards.forEach(function (x) {
        x.classList.remove("is-active");
        x.setAttribute("aria-expanded", "false");
      });
    }

    closeClusterReport = closeAllBoards;
    hideCluster = function () {
      closeAllBoards();
      cluster.classList.add("is-hidden");
      pin.classList.remove("is-active");
    };

    function showCluster() {
      CAMPUSES.forEach(function (x) {
        const sg = document.getElementById("sign-" + x.id);
        sg.classList.remove("is-visible", "is-selected", "report-open");
        sg.querySelector(".lnl-signpost__label").setAttribute("aria-expanded", "false");
        document.getElementById("pin-" + x.id).classList.remove("is-active");
      });
      reportOpen = false;
      cluster.classList.remove("is-hidden");
      pin.classList.add("is-active");
    }

    pin.classList.add("is-active");

    function openClusterReport(c, board) {
      CAMPUSES.forEach(function (x) {
        const s = document.getElementById("sign-" + x.id);
        s.classList.remove("is-visible", "is-selected", "report-open");
        s.querySelector(".lnl-signpost__label").setAttribute("aria-expanded", "false");
        document.getElementById("pin-" + x.id).classList.remove("is-active");
      });
      reportOpen = false;
      if (openId === c.id) {
        closeAllBoards();
        return;
      }
      openId = c.id;
      boards.forEach(function (x) {
        x.classList.remove("is-active");
        x.setAttribute("aria-expanded", "false");
      });
      board.classList.add("is-active");
      board.setAttribute("aria-expanded", "true");
      report.innerHTML =
        '<button type="button" class="lnl-signpost__close" aria-label="Close impact report">&times;</button>' +
        "<p><b>" +
        c.name +
        "</b><br>" +
        (c.report || c.blurb) +
        "</p>" +
        '<div class="lnl-signpost__figures">' +
        "<div><b>" +
        c.statA.value +
        "</b><span>" +
        c.statA.label +
        "</span></div>" +
        "<div><b>" +
        c.statB.value +
        "</b><span>" +
        c.statB.label +
        "</span></div>" +
        "</div>";
      report.querySelector(".lnl-signpost__close").addEventListener("click", function (e) {
        e.stopPropagation();
        closeAllBoards();
      });
      cluster.classList.add("report-open");
      report.style.marginLeft = "0px";
      requestAnimationFrame(function () {
        const rect = report.getBoundingClientRect();
        const m = 12;
        const oR = rect.right - (window.innerWidth - m);
        const oL = m - rect.left;
        if (oR > 0) {
          report.style.marginLeft = -oR + "px";
        } else if (oL > 0) {
          report.style.marginLeft = oL + "px";
        }
      });
    }
  })();

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      updateAllCampusPositions();
      const el = document.getElementById("sign-" + active);
      if (el && el.classList.contains("is-visible")) {
        keepReportInView(el);
      }
    }, 120);
  });
})();
