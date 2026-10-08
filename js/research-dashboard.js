(function () {
  "use strict";

  var root = document.getElementById("research-dashboard");
  if (!root || typeof StudyAnalytics === "undefined") return;

  var A = StudyAnalytics;
  var study = JSON.parse(root.querySelector("[data-study-json]").textContent);
  var questions = A.questionMap(study);
  var plan = study.analysis;
  var endpoint = root.getAttribute("data-endpoint");
  var formPath = root.getAttribute("data-form-path") || "../";
  var KEY_STORE = "lnl-dashboard-key:" + study.id;
  var REFRESH_MS = 60000;

  var BAND_COLOURS = ["#7be4d3", "#bce2f4", "#f6c33c", "#f28b82"];
  var SCALE_COLOURS = ["#7be4d3", "#bce2f4", "#ececec", "#f6c33c", "#f28b82"];
  var HEALTH_COLOURS = ["#7be4d3", "#a8e6da", "#bce2f4", "#f6c33c", "#f28b82"];
  var AWARE_COLOURS = ["#7be4d3", "#f28b82", "#e2e2e2"];
  var ACCESS_COLOURS = ["#7be4d3", "#f6c33c", "#e2e2e2"];
  var LECTURE_COLOURS = ["#7be4d3", "#f6c33c", "#f5a35c", "#f28b82"];
  var MEAL_COLOURS = ["#f28b82", "#f6c33c", "#bce2f4", "#7be4d3"];
  var LADDER_COLOURS = ["#bce2f4", "#bce2f4", "#d6e9c4", "#f6c33c", "#f6c33c", "#f5a35c", "#f28b82", "#f28b82"];
  var TONES = ["#bce2f4", "#f6c33c", "#7be4d3"];
  var INSECURE = "#f28b82";
  var OTHERS = "#7be4d3";

  function $(selector) {
    return root.querySelector(selector);
  }

  var el = {
    lock: $("[data-lock]"),
    lockError: $("[data-lock-error]"),
    toolbar: $("[data-toolbar]"),
    filters: $("[data-filters]"),
    body: $("[data-dashboard]"),
    status: $("[data-status]"),
    statusText: $("[data-status-text]"),
    access: $("[data-access]"),
    refresh: $("[data-refresh]"),
    present: $("[data-present]"),
    print: $("[data-print]"),
    signout: $("[data-signout]"),
    panel: $("[data-present-panel]"),
    panelClose: $("[data-present-close]"),
    qr: $("[data-qr]"),
    presentUrl: $("[data-present-url]"),
    presentState: $("[data-present-state]"),
    publicToggle: $("[data-public-toggle]"),
    slidesOpen: $("[data-slides-open]"),
    slides: $("[data-slides]"),
    slide: $("[data-slide]"),
    slideCount: $("[data-slide-count]"),
    slidePrev: $("[data-slide-prev]"),
    slideNext: $("[data-slide-next]"),
    slideFull: $("[data-slide-full]"),
    slideClose: $("[data-slide-close]"),
    slideProgress: $("[data-slide-progress]")
  };
  var heading = ($("h1") || {}).textContent || study.title;
  var tagline = ($(".lnl-summit__tagline") || {}).textContent || "";
  var conductedBy = root.getAttribute("data-conducted-by") || "";

  var state = {
    key: null,
    demo: /(^|[#&])demo\b/.test(location.hash),
    mode: null,
    records: [],
    excluded: 0,
    analysis: null,
    isPublic: false,
    generatedAt: null,
    lastLoaded: 0,
    filters: {},
    excludeFast: false,
    search: "",
    loading: false,
    filtersBuilt: false,
    current: null,
    slides: [],
    slideIndex: 0,
    openSlidesOnLoad: /(^|[#&])slides\b/.test(location.hash)
  };

  // ---------- Formatting ----------

  function esc(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function num(value) {
    if (value === null || value === undefined || isNaN(value)) return "–";
    return String(Math.round(value * 10) / 10);
  }

  function pctText(value) {
    return value === null || value === undefined ? "–" : num(value) + "%";
  }

  function pText(p) {
    if (p === null || p === undefined) return "";
    return p < 0.001 ? "p < 0.001" : "p = " + p.toFixed(3);
  }

  function shortLabel(label) {
    return String(label).split(" (e.g.")[0];
  }

  function minCellText(a) {
    return "n<" + (a.minCell || 5);
  }

  // ---------- Chart primitives ----------

  function legend(labels, colours) {
    return (
      '<ul class="lnl-dash__legend">' +
      labels
        .map(function (label, i) {
          return '<li><span style="background:' + colours[i % colours.length] + '"></span>' + esc(shortLabel(label)) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  /** Horizontal bars. items: { label, pct, count, n, lo, hi, suppressed, display } */
  function bars(items, opts) {
    opts = opts || {};
    var list = items.slice();
    if (opts.sort) {
      list.sort(function (a, b) {
        var lastA = opts.last && opts.last.indexOf(a.label) !== -1;
        var lastB = opts.last && opts.last.indexOf(b.label) !== -1;
        if (lastA !== lastB) return lastA ? 1 : -1;
        return (b.pct || 0) - (a.pct || 0);
      });
    }
    var max = opts.max || 100;
    return (
      '<ul class="lnl-dash__bars">' +
      list
        .map(function (item, i) {
          var value = item.suppressed ? null : item.pct;
          var width = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
          var colour = opts.colours ? opts.colours[i % opts.colours.length] : opts.colour || TONES[0];
          var display = item.suppressed ? opts.suppressedText || "n<5" : item.display || pctText(value);
          var meta = "";
          if (!item.suppressed && opts.counts !== false && item.count !== null && item.count !== undefined) {
            meta = " <small>" + item.count + (opts.showN && item.n ? "/" + item.n : "") + "</small>";
          } else if (opts.showN && item.n) {
            meta = " <small>n=" + item.n + "</small>";
          }
          var ci =
            opts.ci && !item.suppressed && item.lo !== null && item.lo !== undefined
              ? '<span class="lnl-dash__ci" style="left:' + item.lo + "%;width:" + Math.max(0.5, item.hi - item.lo) + '%" title="95% CI ' + num(item.lo) + "–" + num(item.hi) + '%"></span>'
              : "";
          return (
            '<li class="lnl-dash__bar' +
            (item.small ? " is-small" : "") +
            '"' +
            (item.small ? ' title="Fewer than 5 responses: interpret with caution"' : "") +
            '><span class="lnl-dash__bar-label">' +
            esc(opts.fullLabels ? item.label : shortLabel(item.label)) +
            '</span><span class="lnl-dash__track"><span class="lnl-dash__fill" style="width:' +
            width +
            "%;background:" +
            colour +
            '"></span>' +
            ci +
            '</span><span class="lnl-dash__bar-value">' +
            display +
            meta +
            "</span></li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  /** 100% stacked bars. rows: { label, n, parts: [{ label, pct, count }], suppressed } */
  function stacked(rows, labels, colours, a) {
    return (
      legend(labels, colours) +
      '<div class="lnl-dash__stacks">' +
      rows
        .map(function (row) {
          var segments;
          if (row.suppressed || !row.n) {
            segments =
              '<span class="lnl-dash__seg lnl-dash__seg--empty">' +
              (row.suppressed ? "Fewer than " + ((a && a.minCell) || 5) + " responses" : "No responses yet") +
              "</span>";
          } else {
            segments = row.parts
              .map(function (part, i) {
                if (!part.pct) return "";
                return (
                  '<span class="lnl-dash__seg" style="width:' +
                  part.pct +
                  "%;background:" +
                  colours[i % colours.length] +
                  '" title="' +
                  esc(part.label) +
                  ": " +
                  pctText(part.pct) +
                  " (" +
                  part.count +
                  ')">' +
                  (part.pct >= 9 ? Math.round(part.pct) + "%" : "") +
                  "</span>"
                );
              })
              .join("");
          }
          return (
            '<div class="lnl-dash__stack-row"><span class="lnl-dash__stack-label">' +
            esc(shortLabel(row.label)) +
            " <small>n=" +
            row.n +
            '</small></span><div class="lnl-dash__stack">' +
            segments +
            "</div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  /** Vertical columns for score distributions and the daily response timeline. */
  function columnChart(items, opts) {
    opts = opts || {};
    var max = Math.max.apply(
      null,
      [1].concat(
        items.map(function (item) {
          return item.count;
        })
      )
    );
    var every = opts.labelEvery || 1;
    return (
      '<div class="lnl-dash__cols" style="--cols:' +
      items.length +
      '">' +
      items
        .map(function (item, i) {
          var colour = typeof opts.colour === "function" ? opts.colour(item, i) : opts.colour || TONES[0];
          var showLabel = i % every === 0 || i === items.length - 1;
          return (
            '<div class="lnl-dash__col" title="' +
            esc((opts.title ? opts.title(item) : item.label) + ": " + item.count) +
            '"><span class="lnl-dash__col-value">' +
            (item.count || "") +
            '</span><span class="lnl-dash__col-bar" style="height:' +
            (item.count / max) * 100 +
            "%;background:" +
            colour +
            '"></span><span class="lnl-dash__col-label">' +
            (showLabel ? esc(opts.label ? opts.label(item) : item.label) : "") +
            "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function donut(items, colours, centreValue, centreLabel, a) {
    var start = 0;
    var stops = items.map(function (item, i) {
      var from = start;
      start += item.pct || 0;
      return colours[i] + " " + from + "% " + start + "%";
    });
    if (start < 99.5) stops.push("#f1f1f1 " + start + "% 100%");
    return (
      '<div class="lnl-dash__donut-wrap"><div class="lnl-dash__donut" style="background:conic-gradient(' +
      stops.join(",") +
      ')"><span><strong>' +
      centreValue +
      "</strong>" +
      esc(centreLabel) +
      '</span></div><ul class="lnl-dash__legend lnl-dash__legend--values">' +
      items
        .map(function (item, i) {
          return (
            '<li><span style="background:' +
            colours[i] +
            '"></span>' +
            esc(item.label) +
            " <strong>" +
            (item.pct === null ? minCellText(a) : pctText(item.pct)) +
            "</strong>" +
            (item.count !== null && item.count !== undefined ? " <small>(" + item.count + ")</small>" : "") +
            "</li>"
          );
        })
        .join("") +
      "</ul></div>"
    );
  }

  function badge(text, tone, title) {
    return '<span class="lnl-dash__badge' + (tone ? " is-" + tone : "") + '"' + (title ? ' title="' + esc(title) + '"' : "") + ">" + esc(text) + "</span>";
  }

  function testBadges(test) {
    if (!test) return badge("Not enough data to test");
    var out = test.p < 0.05 ? badge(pText(test.p) + " · significant", "sig") : badge(pText(test.p) + " · not significant");
    if (test.lowExpected) out += badge("small cells", "warn", "Some expected counts are below 5. Treat the p-value with caution or merge groups.");
    return out;
  }

  function card(title, body, opts) {
    opts = opts || {};
    return (
      '<article class="lnl-dash__card' +
      (opts.wide ? " lnl-dash__card--wide" : "") +
      (opts.tone ? " lnl-dash__card--" + opts.tone : "") +
      '"><header class="lnl-dash__card-head"><h3>' +
      esc(title) +
      "</h3>" +
      (opts.badges ? '<div class="lnl-dash__badges">' + opts.badges + "</div>" : "") +
      "</header>" +
      (opts.note ? '<p class="lnl-dash__note">' + opts.note + "</p>" : "") +
      body +
      "</article>"
    );
  }

  function section(id, letter, title, lead, cards) {
    return (
      '<section class="lnl-dash__section" id="dash-' +
      id +
      '"><h2 class="lnl-dash__heading"><span class="lnl-study__letter">' +
      esc(letter) +
      "</span>" +
      esc(title) +
      "</h2>" +
      (lead ? '<p class="lnl-dash__lead">' + lead + "</p>" : "") +
      '<div class="lnl-dash__grid">' +
      cards.join("") +
      "</div></section>"
    );
  }

  function allRow(d) {
    return { label: "All students", n: d.n, parts: d.items };
  }

  function outcome(a, id) {
    for (var i = 0; i < a.outcomes.length; i++) if (a.outcomes[i].id === id) return a.outcomes[i];
    return null;
  }

  // ---------- Dashboard sections ----------

  function kpi(label, value, sub, tone) {
    return (
      '<div class="lnl-dash__kpi' +
      (tone ? " lnl-dash__kpi--" + tone : "") +
      '"><p class="lnl-dash__kpi-label">' +
      esc(label) +
      '</p><p class="lnl-dash__kpi-value">' +
      value +
      "</p>" +
      (sub ? '<p class="lnl-dash__kpi-sub">' + sub + "</p>" : "") +
      "</div>"
    );
  }

  function overview(a) {
    var k = a.kpis;
    var campus = a.sample[0];
    var lectures = outcome(a, plan.consequences.lectures);
    var meals = outcome(a, plan.diet.meals);
    var ten = k.insecure.pct === null ? "–" : Math.round(k.insecure.pct / 10);
    var headline =
      '<p class="lnl-dash__headline"><strong>' +
      pctText(k.insecure.pct) +
      "</strong> of the " +
      a.n +
      " students surveyed experienced <strong>moderate or severe food insecurity</strong> in the last 12 months, about " +
      ten +
      " in 10 (95% CI " +
      num(k.insecure.lo) +
      "–" +
      num(k.insecure.hi) +
      "%). " +
      pctText(k.severe.pct) +
      " were <strong>severely</strong> food insecure.</p>";
    var cards = [
      kpi(
        "Responses",
        String(a.n),
        campus
          ? campus.dist.items
              .map(function (item) {
                return esc(item.label.replace(/ \(.*\)/, "")) + " " + (item.count === null ? minCellText(a) : item.count);
              })
              .join(" · ")
          : "",
        "blue"
      ),
      kpi("Moderate or severe food insecurity", pctText(k.insecure.pct), "95% CI " + num(k.insecure.lo) + "–" + num(k.insecure.hi) + "% · FIES score 4–8", "yellow"),
      kpi("Severe food insecurity", pctText(k.severe.pct), "FIES score 7–8", "red"),
      kpi("Any food insecurity", pctText(k.any.pct), "Mild, moderate or severe · FIES score 1–8", ""),
      kpi("Mean FIES score", num(k.meanFies) + '<small> / 8</small>', "Food Insecurity Experience Scale", ""),
      kpi("Mean dietary diversity", num(k.meanIdds) + '<small> / 10</small>', pctText(k.lowDiversity.pct) + " have low dietary diversity (IDDS ≤ 3)", "teal"),
      lectures ? kpi("Missed lectures due to hunger", pctText(lectures.all.pct), "At least one lecture in the past 30 days", "") : "",
      meals ? kpi("One meal a day", pctText(meals.all.pct), "Typically eat only one meal per day", "") : ""
    ];
    return (
      '<section class="lnl-dash__section" id="dash-overview">' +
      headline +
      '<div class="lnl-dash__kpis">' +
      cards.join("") +
      "</div></section>"
    );
  }

  function sampleSection(a) {
    var t = a.timeline;
    var every = Math.max(1, Math.ceil(t.items.length / 8));
    var cards = [
      card(
        "Responses over time",
        t.items.length
          ? columnChart(t.items, {
              labelEvery: every,
              colour: TONES[1],
              label: function (item) {
                var d = new Date(item.label + "T00:00:00Z");
                return d.getUTCDate() + " " + d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
              },
              title: function (item) {
                return item.label + " (running total " + item.cumulative + ")";
              }
            })
          : '<p class="lnl-dash__empty-note">No dated responses yet.</p>',
        { wide: true, note: "Responses received per day (Kampala time)." }
      )
    ].concat(
      a.sample.map(function (s, i) {
        return card(s.label, bars(s.dist.items, { colour: TONES[i % 3], suppressedText: minCellText(a) }), { note: "n = " + s.dist.n });
      })
    );
    return section("sample", "B", "Who took part", "Use these to judge how well the sample covers each campus, year and college before drawing conclusions.", cards);
  }

  function prevalenceSection(a) {
    var f = a.fies;
    var cards = [
      card("Food security status", donut(f.bands.items, BAND_COLOURS, pctText(a.kpis.insecure.pct), "moderate or severe", a), {
        note: "FIES raw score bands: 0 food secure · 1–3 mild · 4–6 moderate · 7–8 severe."
      }),
      card(
        "FIES experiences, from mild to severe",
        bars(
          f.items.map(function (item) {
            return { label: item.id + " · " + item.label, pct: item.pct, count: item.count };
          }),
          { colours: LADDER_COLOURS, fullLabels: true }
        ),
        { note: "Share answering “Yes” for the last 12 months. The eight items run from worry (mild) to a whole day without food (severe)." }
      ),
      card(
        "FIES raw score distribution",
        columnChart(f.scores.items, {
          colour: function (item) {
            var s = Number(item.label);
            return s === 0 ? BAND_COLOURS[0] : s <= 3 ? BAND_COLOURS[1] : s <= 6 ? BAND_COLOURS[2] : BAND_COLOURS[3];
          },
          title: function (item) {
            return "Score " + item.label;
          }
        }),
        { note: "Number of students at each score (0–8 “Yes” answers)." }
      )
    ];
    return section("prevalence", "D", "Prevalence of food insecurity", "Measured with the FAO Food Insecurity Experience Scale (FIES), 12-month recall.", cards);
  }

  function determinantsSection(a, team) {
    var all = [];
    a.determinants.forEach(function (group) {
      group.items.forEach(function (d) {
        all.push(d);
      });
    });
    var tested = all
      .filter(function (d) {
        return d.test;
      })
      .sort(function (x, y) {
        return x.test.p - y.test.p;
      });
    var summaryRows = tested
      .map(function (d) {
        var top = d.rows
          .filter(function (row) {
            return row.n >= 5 && !row.suppressed;
          })
          .sort(function (x, y) {
            return (y.pct || 0) - (x.pct || 0);
          })[0];
        return (
          "<tr" +
          (d.test.p < 0.05 ? ' class="is-sig"' : "") +
          "><th scope=\"row\">" +
          esc(d.label) +
          "</th><td>" +
          num(d.test.stat) +
          " <small>(df " +
          d.test.df +
          ")</small></td><td>" +
          esc(pText(d.test.p)) +
          (d.test.lowExpected ? " <small>†</small>" : "") +
          "</td><td>" +
          (top ? esc(shortLabel(top.label)) + " <small>" + pctText(top.pct) + "</small>" : "–") +
          "</td></tr>"
        );
      })
      .join("");
    var summary = card(
      "Strongest associations with food insecurity",
      tested.length
        ? '<div class="lnl-dash__table-wrap"><table class="lnl-dash__table"><thead><tr><th>Factor</th><th>χ²</th><th>p-value</th><th>Most affected group</th></tr></thead><tbody>' +
            summaryRows +
            '</tbody></table></div><p class="lnl-dash__fine">Pearson chi-square test of each factor against moderate/severe food insecurity. Highlighted rows are significant at p &lt; 0.05. † some expected counts are below 5, so interpret with caution. These are bivariate associations; confirm with regression in the final analysis.</p>'
        : '<p class="lnl-dash__empty-note">Tests appear once there are enough responses in more than one group.</p>',
      { wide: true, tone: "yellow" }
    );

    var cards = [summary];
    a.determinants.forEach(function (group) {
      cards.push('<h3 class="lnl-dash__subhead">' + esc(group.group) + "</h3>");
      group.items.forEach(function (d) {
        var rows = d.rows
          .filter(function (row) {
            return row.n > 0;
          })
          .map(function (row) {
            return {
              label: row.label,
              pct: row.pct,
              count: row.insecure,
              n: row.n,
              lo: row.lo,
              hi: row.hi,
              suppressed: row.suppressed,
              small: team && row.n < 5
            };
          });
        cards.push(
          card(
            d.label,
            rows.length ? bars(rows, { colour: "#f6c33c", ci: true, showN: true, suppressedText: minCellText(a) }) : '<p class="lnl-dash__empty-note">No responses yet.</p>',
            { badges: testBadges(d.test), note: "% moderately or severely food insecure, with 95% CI" }
          )
        );
      });
    });
    return section(
      "determinants",
      "C",
      "Who is most affected",
      "Prevalence of moderate or severe food insecurity across demographic and socio-economic groups (objective: determinants).",
      cards
    );
  }

  function compareRows(items, a) {
    return (
      legend(["Moderately or severely food insecure", "Food secure or mildly insecure"], [INSECURE, OTHERS]) +
      '<div class="lnl-dash__compare">' +
      items
        .map(function (o) {
          function bar(p, colour) {
            var suppressed = p.suppressed || p.pct === null;
            return (
              '<div class="lnl-dash__pair"><span class="lnl-dash__track"><span class="lnl-dash__fill" style="width:' +
              (suppressed ? 0 : p.pct) +
              "%;background:" +
              colour +
              '"></span></span><span class="lnl-dash__bar-value">' +
              (p.suppressed ? minCellText(a) : pctText(p.pct)) +
              (p.n && !p.suppressed ? " <small>" + p.count + "/" + p.n + "</small>" : "") +
              "</span></div>"
            );
          }
          var ratio = o.ratio ? badge("× " + num(o.ratio), o.ratio >= 1.5 ? "sig" : "", "Prevalence ratio: food-insecure versus others") : "";
          var sig = o.test && o.test.p < 0.05 ? badge(pText(o.test.p), "") : "";
          return (
            '<div class="lnl-dash__compare-row"><p class="lnl-dash__compare-label">' +
            esc(o.label) +
            " " +
            ratio +
            sig +
            "</p>" +
            bar(o.insecure, INSECURE) +
            bar(o.others, OTHERS) +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function scaleCard(s, a) {
    var items = s.items.map(function (item) {
      return { label: item.id + " · " + item.label, n: item.n, parts: item.parts };
    });
    var index = s.byBand.map(function (row) {
      return {
        label: row.label,
        pct: row.mean === null ? null : ((row.mean - 1) / 4) * 100,
        display: row.suppressed ? null : num(row.mean),
        n: row.n,
        suppressed: row.suppressed
      };
    });
    return card(
      s.label,
      stacked(items, s.columns, SCALE_COLOURS, a) +
        '<p class="lnl-dash__minihead">Mean score by food security status <small>(1 = ' +
        esc(s.columns[0]) +
        " … 5 = " +
        esc(s.columns[s.columns.length - 1]) +
        ")</small></p>" +
        bars(index, { colours: BAND_COLOURS, counts: false, showN: true, suppressedText: minCellText(a) }),
      { note: esc(s.prompt.replace(/:$/, ".")) + " Overall mean " + num(s.index) + " / 5." }
    );
  }

  function consequencesSection(a) {
    var c = a.consequences;
    var lecturesQ = questions[plan.consequences.lectures];
    var healthQ = questions[plan.consequences.health];
    var cards = [
      card("Outcomes: food-insecure students versus others", compareRows(a.outcomes, a), {
        wide: true,
        tone: "yellow",
        note: "Share of each group reporting the outcome. × = prevalence ratio (how many times more common among food-insecure students)."
      }),
      card(lecturesQ.short, stacked([allRow(c.lectures)].concat(c.lecturesByBand), lecturesQ.options, LECTURE_COLOURS, a), {
        note: esc(lecturesQ.text)
      }),
      card(
        "Coping strategies used",
        bars(c.coping.items, { colour: INSECURE, sort: true, last: [questions[plan.consequences.coping].exclusive] }),
        { note: "Past 30 days, % of " + c.coping.n + " respondents (more than one could be chosen)." }
      )
    ];
    c.scales.forEach(function (s) {
      cards.push(scaleCard(s, a));
    });
    cards.push(
      card(healthQ.short, stacked([allRow(c.health)].concat(c.healthByBand), healthQ.options, HEALTH_COLOURS, a), { note: esc(healthQ.text) }),
      card("Social impact", compareRows(c.social, a), { note: "Past 30 days, % answering “Yes”." })
    );
    return section("consequences", "H", "Consequences", "Academic, mental, physical and social effects, compared between food-insecure students and the rest.", cards);
  }

  function dietSection(a) {
    var d = a.diet;
    var mealsQ = questions[plan.diet.meals];
    var iddsQ = questions[study.scoring.idds.question];
    var cards = [
      card("Dietary diversity", donut(a.idds.bands.items, ["#f28b82", "#f6c33c", "#7be4d3"], num(a.kpis.meanIdds), "mean IDDS / 10", a), {
        note: "Individual Dietary Diversity Score from yesterday's food groups: low ≤ 3 · medium 4–5 · high ≥ 6."
      }),
      card(
        "IDDS score distribution",
        columnChart(a.idds.scores.items, {
          colour: function (item) {
            var s = Number(item.label);
            return s <= 3 ? "#f28b82" : s <= 5 ? "#f6c33c" : "#7be4d3";
          },
          title: function (item) {
            return item.label + " food groups";
          }
        }),
        { note: "Number of food groups eaten yesterday (0–10)." }
      ),
      card(
        "Dietary diversity by food security status",
        bars(
          a.fies.iddsByBand.map(function (row) {
            return { label: row.label, pct: row.mean === null ? null : row.mean * 10, display: num(row.mean) + " / 10", n: row.n, suppressed: row.suppressed };
          }),
          { colours: BAND_COLOURS, counts: false, showN: true, suppressedText: minCellText(a) }
        ),
        { note: "Mean IDDS. A falling gradient supports the link between food insecurity and diet quality." }
      ),
      card("Food groups eaten yesterday", bars(a.idds.groups.items, { colour: TONES[2] }), {
        wide: true,
        note: "% of " + a.idds.groups.n + " students who ate from each FAO food group. " + esc(iddsQ.hint || "")
      }),
      card(mealsQ.short, stacked([allRow(d.meals)].concat(d.mealsByBand), mealsQ.options, MEAL_COLOURS, a), { note: esc(mealsQ.text) }),
      card("Where students eat", bars(d.places.items, { colour: TONES[0], sort: true }), {
        note: "% of " + d.places.n + " respondents (more than one could be chosen)."
      })
    ];
    return section("diet", "F", "Diet and dietary diversity", "Yesterday's diet (FAO IDDS), meal frequency and where students eat.", cards);
  }

  function supportSection(a) {
    var s = a.support;
    var awareQ = questions[plan.support.awareness];
    var accessQ = questions[plan.support.accessed];
    var cards = [
      card(awareQ.text, stacked(s.awareness, awareQ.columns, AWARE_COLOURS, a), {
        wide: true,
        note: "High “Don't Know” shares point to an awareness gap, separate from whether a programme exists."
      }),
      card(accessQ.text, stacked([allRow(s.accessed)].concat(s.accessedByBand), accessQ.options, ACCESS_COLOURS, a), {
        wide: true,
        note: "Compare uptake among severely food-insecure students with everyone else to see whether support reaches those who need it."
      })
    ];
    return section("support", "I", "Institutional support and awareness", "", cards);
  }

  function voicesSection(a, team) {
    var v = a.voices;
    var max = v.keywords.length ? v.keywords[0].count : 1;
    var cloud = v.keywords.length
      ? '<ul class="lnl-dash__cloud">' +
        v.keywords
          .map(function (word, i) {
            var size = 0.85 + (word.count / max) * 1.1;
            return (
              '<li style="font-size:' +
              size.toFixed(2) +
              "rem;background:" +
              TONES[i % 3] +
              '" title="Mentioned by ' +
              word.count +
              ' students">' +
              esc(word.label) +
              " <small>" +
              word.count +
              "</small></li>"
            );
          })
          .join("") +
        "</ul>"
      : '<p class="lnl-dash__empty-note">Keywords appear as students share suggestions.</p>';
    var cards = [
      card("What students are asking for", cloud, {
        wide: true,
        note: v.responses + " students wrote a suggestion. Words are counted once per student; common words are removed."
      })
    ];
    if (team && v.recommendations) {
      var query = state.search.toLowerCase();
      var list = v.recommendations.filter(function (item) {
        return !query || item.text.toLowerCase().indexOf(query) !== -1;
      });
      cards.push(
        card(
          "Suggested interventions (verbatim)",
          '<label class="lnl-dash__search"><span>Search suggestions</span><input class="form-input" type="search" data-search value="' +
            esc(state.search) +
            '" placeholder="e.g. cafeteria, subsidy, garden"></label><p class="lnl-dash__fine">' +
            list.length +
            " of " +
            v.recommendations.length +
            ' shown · newest first · confidential, research team only</p><ol class="lnl-dash__quotes">' +
            list
              .slice(0, 200)
              .map(function (item) {
                return (
                  "<li><p>" +
                  esc(item.text) +
                  '</p><p class="lnl-dash__quote-meta">' +
                  esc(item.campus.replace(/ \(.*\)/, "")) +
                  (item.band ? " · " + esc(item.band) : "") +
                  "</p></li>"
                );
              })
              .join("") +
            "</ol>",
          { wide: true }
        )
      );
      if (v.programmes && v.programmes.length) {
        cards.push(
          card(
            "Support programmes students have used",
            '<ul class="lnl-dash__quotes lnl-dash__quotes--compact">' +
              v.programmes
                .map(function (item) {
                  return "<li><p>" + esc(item.text) + "</p></li>";
                })
                .join("") +
              "</ul>",
            { wide: true, note: "Answers to I2 “Which one(s)?”" }
          )
        );
      }
    }
    return section("voices", "J", "Student voices", "", cards);
  }

  function qualitySection(a) {
    var q = a.quality;
    var stats = [
      ["Responses received", state.records.length + state.excluded],
      ["Excluded via Notes", state.excluded],
      ["In this view", a.n],
      ["Completed in under " + q.fastMinutes + " min", q.fast],
      ["Same answer on every scale item", q.straightLiners],
      ["Median minutes to complete", num(q.medianMinutes)]
    ];
    var body =
      '<dl class="lnl-dash__stats">' +
      stats
        .map(function (s) {
          return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>";
        })
        .join("") +
      '</dl><p class="lnl-dash__fine">To drop an invalid response, type <strong>EXCLUDE</strong> at the start of its Notes cell in the Responses sheet (for example “EXCLUDE – duplicate”). Use the filter above to preview results without very fast completions. Straight-lining (identical answers on all 13 scale items) can signal careless responding, so review those rows.</p>';
    return section("quality", "✓", "Data quality and cleaning", "", [card("Checks", body, { wide: true })]);
  }

  function methods(a) {
    return (
      '<section class="lnl-dash__section lnl-dash__methods"><h2 class="lnl-dash__heading"><span class="lnl-study__letter">i</span>How to read this dashboard</h2><div class="lnl-dash__card lnl-dash__card--wide"><ul>' +
      "<li><strong>Food insecurity (FIES).</strong> Eight Yes/No FAO questions with 12-month recall. The raw score (0–8) is banded as food secure (0), mild (1–3), moderate (4–6) and severe (7–8). “Food insecure” in comparisons means moderate or severe.</li>" +
      "<li><strong>Dietary diversity (IDDS).</strong> Count of 10 FAO food groups eaten yesterday: low ≤ 3, medium 4–5, high ≥ 6.</li>" +
      "<li><strong>Uncertainty.</strong> Prevalence figures show Wilson 95% confidence intervals (thin black bands on bars). Small groups give wide intervals.</li>" +
      "<li><strong>Tests.</strong> Pearson chi-square tests compare food insecurity across groups. Significance does not imply causation and is not adjusted for other factors.</li>" +
      "<li><strong>Privacy.</strong> No names or contact details are collected. The shared (presentation) view shows aggregated results only and hides groups with fewer than " +
      (plan.publicMinCell || 5) +
      " students.</li>" +
      "<li><strong>Live data.</strong> Results update automatically every minute while this page is open.</li>" +
      "</ul></div></section>"
    );
  }

  function emptyState(team) {
    var filtered = team && state.records.length > 0;
    return (
      '<section class="lnl-dash__section"><div class="lnl-dash__card lnl-dash__card--wide lnl-dash__empty"><h3>' +
      (filtered ? "No responses match these filters" : "No responses yet") +
      "</h3><p>" +
      (filtered
        ? "Clear or change the filters above to see results."
        : "Charts will appear here as soon as the first student submits the questionnaire. This page refreshes itself every minute.") +
      '</p><a class="lnl-summit__submit lnl-dash__cta" href="' +
      esc(formPath) +
      '">Open the questionnaire</a></div></section>'
    );
  }

  function view(a, team) {
    if (!a || !a.n) return emptyState(team);
    return [
      overview(a),
      sampleSection(a),
      prevalenceSection(a),
      determinantsSection(a, team),
      consequencesSection(a),
      dietSection(a),
      supportSection(a),
      voicesSection(a, team),
      team ? qualitySection(a) : "",
      methods(a)
    ].join("");
  }

  // ---------- Filters ----------

  function buildFilters() {
    if (state.filtersBuilt) return;
    state.filtersBuilt = true;
    var html = plan.filters
      .map(function (id) {
        var q = questions[id];
        return (
          '<label class="lnl-dash__filter"><span>' +
          esc(q.short) +
          '</span><select data-filter="' +
          esc(id) +
          '"><option value="">All</option>' +
          q.options
            .map(function (option) {
              return '<option value="' + esc(option) + '">' + esc(option) + "</option>";
            })
            .join("") +
          "</select></label>"
        );
      })
      .join("");
    html +=
      '<label class="lnl-dash__check"><input type="checkbox" data-exclude-fast> Hide completions under ' +
      plan.fastMinutes +
      ' min</label><button type="button" class="lnl-dash__btn lnl-dash__btn--ghost" data-reset>Reset filters</button>';
    el.filters.innerHTML = html;

    el.filters.addEventListener("change", function (event) {
      var target = event.target;
      if (target.hasAttribute("data-filter")) state.filters[target.getAttribute("data-filter")] = target.value;
      if (target.hasAttribute("data-exclude-fast")) state.excludeFast = target.checked;
      render();
    });
    el.filters.addEventListener("click", function (event) {
      if (!event.target.hasAttribute("data-reset")) return;
      state.filters = {};
      state.excludeFast = false;
      Array.prototype.forEach.call(el.filters.querySelectorAll("select"), function (select) {
        select.value = "";
      });
      el.filters.querySelector("[data-exclude-fast]").checked = false;
      render();
    });
  }

  function activeFilterCount() {
    var total = state.excludeFast ? 1 : 0;
    for (var id in state.filters) if (state.filters[id]) total++;
    return total;
  }

  // ---------- Rendering & status ----------

  function setStatus(kind, text) {
    el.status.className = "lnl-summit__meta lnl-dash__status is-" + kind;
    el.statusText.textContent = text;
  }

  function timeText(iso) {
    var date = iso ? new Date(iso) : new Date();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function render() {
    var team = state.mode === "team";
    var analysis = team
      ? A.analyse(A.filter(state.records, state.filters, study, { excludeFast: state.excludeFast }), study, { includeText: true })
      : state.analysis;

    el.toolbar.hidden = false;
    el.filters.hidden = !team;
    el.present.hidden = !team;
    el.signout.hidden = !team || state.demo;
    if (team) buildFilters();

    el.access.hidden = false;
    el.access.className = "lnl-summit__meta lnl-dash__access" + (state.demo ? " is-demo" : team ? (state.isPublic ? " is-open" : "") : " is-open");
    el.access.textContent = state.demo
      ? "Demo data: not real responses"
      : team
      ? state.isPublic
        ? "Research team · open to attendees"
        : "Research team · private"
      : "Shared view · aggregated results";

    var filtered = activeFilterCount();
    setStatus(
      "live",
      "Live · updated " +
        timeText(state.generatedAt) +
        (team && filtered ? " · " + analysis.n + " of " + state.records.length + " responses (" + filtered + " filter" + (filtered > 1 ? "s" : "") + ")" : "")
    );

    state.current = { analysis: analysis, team: team };
    el.slidesOpen.hidden = !analysis || !analysis.n;
    if (!el.slides.hidden) refreshSlides();
    else if (state.openSlidesOnLoad && analysis && analysis.n) {
      state.openSlidesOnLoad = false;
      openSlides();
    }

    var scrollY = window.scrollY;
    var focusedSearch = document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute("data-search");
    var caret = focusedSearch ? document.activeElement.selectionStart : null;
    el.body.innerHTML = view(analysis, team);
    window.scrollTo(0, scrollY);

    var search = el.body.querySelector("[data-search]");
    if (search) {
      if (focusedSearch) {
        search.focus();
        search.setSelectionRange(caret, caret);
      }
      search.addEventListener("input", function () {
        state.search = search.value;
        render();
      });
    }
    updatePresentPanel();
  }

  // ---------- Data loading ----------

  function storedKey() {
    try {
      return localStorage.getItem(KEY_STORE);
    } catch (error) {
      return null;
    }
  }

  function storeKey(key) {
    state.key = key;
    try {
      localStorage.setItem(KEY_STORE, key);
    } catch (error) {
      // Private browsing: key lasts for this visit only.
    }
  }

  function forgetKey() {
    state.key = null;
    try {
      localStorage.removeItem(KEY_STORE);
    } catch (error) {
      // ignore
    }
  }

  function showLock(message) {
    state.mode = null;
    el.lock.hidden = false;
    el.toolbar.hidden = true;
    el.body.innerHTML = "";
    el.access.hidden = true;
    el.lockError.textContent = message || "";
    setStatus("locked", "Private dashboard");
    el.lock.querySelector("input").focus();
  }

  function handle(data) {
    if (!data || !data.ok) {
      if (data && data.error === "wrong-key") {
        forgetKey();
        showLock("That access key isn't right. Check with the research team.");
      } else if (data && data.error === "locked") {
        showLock("");
      } else {
        setStatus("error", "Couldn't load results" + (data && data.error ? ": " + data.error : ""));
      }
      return;
    }
    if (data.mode !== "team" && data.mode !== "public") {
      setStatus("error", "The Google Apps Script has not been updated for the dashboard yet");
      return;
    }
    if (data.keyRejected) forgetKey();
    state.mode = data.mode;
    state.isPublic = Boolean(data.public);
    state.generatedAt = data.generatedAt;
    state.excluded = data.excluded || 0;
    state.lastLoaded = Date.now();
    if (data.mode === "team") state.records = data.records || [];
    else state.analysis = data.analysis;
    el.lock.hidden = true;
    render();
  }

  function load(options) {
    if (state.loading) return;
    if (state.demo) {
      state.mode = "team";
      state.records = demoRecords();
      state.generatedAt = new Date().toISOString();
      state.lastLoaded = Date.now();
      el.lock.hidden = true;
      render();
      return;
    }
    if (!endpoint) {
      setStatus("error", "No data source configured");
      return;
    }
    state.loading = true;
    el.refresh.disabled = true;
    if (state.mode) setStatus("loading", "Updating…");
    var url =
      endpoint +
      "?view=dashboard&t=" +
      Date.now() +
      (state.key ? "&key=" + encodeURIComponent(state.key) : "") +
      (options && options.publicState ? "&public=" + options.publicState : "");
    fetch(url, { cache: "no-store" })
      .then(function (response) {
        return response.json();
      })
      .then(handle)
      .catch(function () {
        setStatus("error", "Couldn't reach the results. Retrying in a minute.");
      })
      .then(function () {
        state.loading = false;
        el.refresh.disabled = false;
      });
  }

  // ---------- Presentation mode ----------

  function dashboardUrl() {
    return location.origin + location.pathname;
  }

  function qrSrc(url) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=0&data=" + encodeURIComponent(url);
  }

  // ---------- Slides: one finding per slide, built from the live analysis ----------

  function slide(kicker, title, body, tone) {
    return { kicker: kicker, title: title, body: body, tone: tone || "" };
  }

  function grid(cards, columns) {
    return '<div class="lnl-dash__slide-grid lnl-dash__slide-grid--' + (columns || cards.length) + '">' + cards.join("") + "</div>";
  }

  function buildSlides(a) {
    var meta =
      '<p class="lnl-dash__slide-meta"><span>' +
      (a ? a.n : 0) +
      " students surveyed</span><span>Live results · " +
      esc(timeText(state.generatedAt)) +
      "</span></p>";
    var list = [slide(study.institution, heading, '<p class="lnl-dash__slide-lead">' + esc(tagline) + "</p>" + meta, "title")];
    if (!a || !a.n) return list;

    var k = a.kpis;
    var ten = k.insecure.pct === null ? "–" : Math.round(k.insecure.pct / 10);
    list.push(
      slide(
        "Prevalence",
        "How many students are food insecure?",
        '<div class="lnl-dash__slide-hero"><p class="lnl-dash__slide-stat">' +
          pctText(k.insecure.pct) +
          '</p><p class="lnl-dash__slide-lead">of students experienced <strong>moderate or severe food insecurity</strong> in the last 12 months, about ' +
          ten +
          ' in 10.</p><p class="lnl-dash__fine">95% CI ' +
          num(k.insecure.lo) +
          "–" +
          num(k.insecure.hi) +
          "% · n = " +
          a.n +
          '</p></div><div class="lnl-dash__kpis">' +
          kpi("Severe food insecurity", pctText(k.severe.pct), "Went hungry or a whole day without food", "red") +
          kpi("Any food insecurity", pctText(k.any.pct), "Mild, moderate or severe", "") +
          kpi("Mean FIES score", num(k.meanFies) + "<small> / 8</small>", "Food Insecurity Experience Scale", "blue") +
          "</div>",
        "yellow"
      )
    );

    var sampleCards = a.sample
      .filter(function (s) {
        return ["CAMPUS", "B2", "B3"].indexOf(s.id) !== -1;
      })
      .map(function (s, i) {
        return card(s.label, bars(s.dist.items, { colour: TONES[i % 3], suppressedText: minCellText(a) }), { note: "n = " + s.dist.n });
      });
    list.push(slide("Who took part", a.n + " undergraduate students", grid(sampleCards, 3)));

    list.push(
      slide(
        "Experiences of food insecurity",
        "From worry to going a whole day without food",
        grid(
          [
            card("Food security status", donut(a.fies.bands.items, BAND_COLOURS, pctText(k.insecure.pct), "moderate or severe", a)),
            card(
              "Answered “Yes” in the last 12 months",
              bars(
                a.fies.items.map(function (item) {
                  return { label: item.label, pct: item.pct, count: item.count };
                }),
                { colours: LADDER_COLOURS, fullLabels: true }
              )
            )
          ],
          2
        )
      )
    );

    var tested = [];
    a.determinants.forEach(function (group) {
      group.items.forEach(function (d) {
        if (d.test) tested.push(d);
      });
    });
    tested.sort(function (x, y) {
      return x.test.p - y.test.p;
    });
    var significant = tested.filter(function (d) {
      return d.test.p < 0.05;
    });
    if (tested.length) {
      list.push(
        slide(
          "Determinants",
          significant.length ? "What is linked to food insecurity?" : "No clear differences between groups yet",
          card(
            "Strongest associations with moderate or severe food insecurity",
            '<div class="lnl-dash__table-wrap"><table class="lnl-dash__table"><thead><tr><th>Factor</th><th>p-value</th><th>Most affected group</th></tr></thead><tbody>' +
              tested
                .slice(0, 7)
                .map(function (d) {
                  var top = d.rows
                    .filter(function (row) {
                      return row.n >= 5 && !row.suppressed;
                    })
                    .sort(function (x, y) {
                      return (y.pct || 0) - (x.pct || 0);
                    })[0];
                  return (
                    "<tr" +
                    (d.test.p < 0.05 ? ' class="is-sig"' : "") +
                    '><th scope="row">' +
                    esc(d.label) +
                    "</th><td>" +
                    esc(pText(d.test.p)) +
                    "</td><td>" +
                    (top ? esc(shortLabel(top.label)) + " <small>" + pctText(top.pct) + "</small>" : "–") +
                    "</td></tr>"
                  );
                })
                .join("") +
              '</tbody></table></div><p class="lnl-dash__fine">Chi-square tests; highlighted rows are significant at p &lt; 0.05.</p>'
          )
        )
      );
    }
    significant.slice(0, 3).forEach(function (d) {
      var rows = d.rows
        .filter(function (row) {
          return row.n > 0;
        })
        .map(function (row) {
          return { label: row.label, pct: row.pct, count: row.insecure, n: row.n, lo: row.lo, hi: row.hi, suppressed: row.suppressed };
        });
      list.push(
        slide(
          "Who is most affected",
          "Food insecurity by " + d.label.toLowerCase(),
          card(
            "% moderately or severely food insecure",
            bars(rows, { colour: "#f6c33c", ci: true, showN: true, suppressedText: minCellText(a) }),
            { badges: testBadges(d.test), note: "Black bands show 95% confidence intervals." }
          )
        )
      );
    });

    var outcomes = a.outcomes
      .filter(function (o) {
        return o.ratio;
      })
      .sort(function (x, y) {
        return y.ratio - x.ratio;
      })
      .slice(0, 6);
    if (outcomes.length) {
      list.push(
        slide(
          "Consequences",
          "Food-insecure students carry a heavier burden",
          card("Share reporting each outcome", compareRows(outcomes, a), { note: "× = how many times more common among food-insecure students." })
        )
      );
    }

    list.push(
      slide(
        "Consequences",
        "Academic, mental and physical health",
        grid(
          a.consequences.scales.map(function (s) {
            return card(
              s.label,
              bars(
                s.byBand.map(function (row) {
                  return {
                    label: row.label,
                    pct: row.mean === null ? null : ((row.mean - 1) / 4) * 100,
                    display: row.suppressed ? null : num(row.mean),
                    n: row.n,
                    suppressed: row.suppressed
                  };
                }),
                { colours: BAND_COLOURS, counts: false, suppressedText: minCellText(a) }
              ),
              { note: "Mean score, 1 (" + esc(s.columns[0]) + ") to 5 (" + esc(s.columns[s.columns.length - 1]) + ")" }
            );
          }),
          3
        )
      )
    );

    var lecturesQ = questions[plan.consequences.lectures];
    list.push(
      slide(
        "Consequences",
        "Hunger in the classroom, and how students cope",
        grid(
          [
            card(lecturesQ.short, stacked([allRow(a.consequences.lectures)].concat(a.consequences.lecturesByBand), lecturesQ.options, LECTURE_COLOURS, a)),
            card(
              "Coping strategies (past 30 days)",
              bars(a.consequences.coping.items, { colour: INSECURE, sort: true, last: [questions[plan.consequences.coping].exclusive] })
            )
          ],
          2
        )
      )
    );

    list.push(
      slide(
        "Diet",
        "What students ate yesterday",
        grid(
          [
            card("Dietary diversity", donut(a.idds.bands.items, ["#f28b82", "#f6c33c", "#7be4d3"], num(k.meanIdds), "mean IDDS / 10", a)),
            card("Food groups eaten", bars(a.idds.groups.items, { colour: TONES[2], sort: true }))
          ],
          2
        )
      )
    );

    var awareQ = questions[plan.support.awareness];
    var accessQ = questions[plan.support.accessed];
    list.push(
      slide(
        "Institutional support",
        "Does support reach the students who need it?",
        grid(
          [
            card("Do students know these programmes exist?", stacked(a.support.awareness, awareQ.columns, AWARE_COLOURS, a)),
            card(accessQ.text, stacked([allRow(a.support.accessed)].concat(a.support.accessedByBand), accessQ.options, ACCESS_COLOURS, a))
          ],
          2
        )
      )
    );

    if (a.voices.keywords.length) {
      var max = a.voices.keywords[0].count;
      list.push(
        slide(
          "Student voices",
          "What students are asking for",
          '<ul class="lnl-dash__cloud lnl-dash__cloud--slide">' +
            a.voices.keywords
              .slice(0, 24)
              .map(function (word, i) {
                return (
                  '<li style="font-size:' +
                  (1.1 + (word.count / max) * 1.8).toFixed(2) +
                  "rem;background:" +
                  TONES[i % 3] +
                  '">' +
                  esc(word.label) +
                  " <small>" +
                  word.count +
                  "</small></li>"
                );
              })
              .join("") +
            '</ul><p class="lnl-dash__fine">' +
            a.voices.responses +
            " students wrote a suggestion. Numbers show how many students used each word.</p>"
        )
      );
    }

    var url = dashboardUrl();
    list.push(
      slide(
        "Thank you",
        "Explore the live results yourself",
        '<div class="lnl-dash__slide-close"><img class="lnl-dash__qr" src="' +
          esc(qrSrc(url)) +
          '" alt="QR code linking to the live dashboard" width="320" height="320"><div><p class="lnl-dash__present-url">' +
          esc(url.replace(/^https?:\/\//, "")) +
          '</p><p class="lnl-dash__slide-lead">Scan the code to open the dashboard on your phone. Results update as new responses arrive.</p>' +
          (conductedBy ? '<p class="lnl-dash__fine"><strong>' + esc(conductedBy) + "</strong></p>" : "") +
          "</div></div>",
        "title"
      )
    );
    return list;
  }

  function renderSlide() {
    var total = state.slides.length;
    state.slideIndex = Math.max(0, Math.min(state.slideIndex, total - 1));
    var current = state.slides[state.slideIndex];
    var n = state.current && state.current.analysis ? state.current.analysis.n : 0;
    el.slide.className = "lnl-dash__slide" + (current.tone ? " lnl-dash__slide--" + current.tone : "");
    el.slide.innerHTML =
      '<header class="lnl-dash__slide-head"><p class="lnl-summit__kicker">' +
      esc(current.kicker) +
      "</p><h2>" +
      esc(current.title) +
      '</h2></header><div class="lnl-dash__slide-body">' +
      current.body +
      '</div><footer class="lnl-dash__slide-foot"><span>' +
      esc(heading) +
      "</span><span>" +
      (state.demo ? "Demo data · " : "") +
      "n = " +
      n +
      " · live</span></footer>";
    el.slideCount.textContent = state.slideIndex + 1 + " / " + total;
    el.slideProgress.style.width = ((state.slideIndex + 1) / total) * 100 + "%";
    el.slidePrev.disabled = state.slideIndex === 0;
    el.slideNext.disabled = state.slideIndex === total - 1;
  }

  function refreshSlides() {
    state.slides = buildSlides(state.current && state.current.analysis);
    renderSlide();
  }

  function openSlides() {
    if (!el.panel.hidden) closePanel();
    el.slides.hidden = false;
    document.body.classList.add("lnl-dash-presenting");
    refreshSlides();
    el.slideNext.focus();
  }

  function closeSlides() {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    el.slides.hidden = true;
    document.body.classList.remove("lnl-dash-presenting");
    el.slidesOpen.focus();
  }

  function goSlide(step) {
    state.slideIndex += step;
    renderSlide();
  }

  el.slidesOpen.addEventListener("click", openSlides);
  el.slideClose.addEventListener("click", closeSlides);
  el.slidePrev.addEventListener("click", function () {
    goSlide(-1);
  });
  el.slideNext.addEventListener("click", function () {
    goSlide(1);
  });
  el.slideFull.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.slides.requestFullscreen) el.slides.requestFullscreen();
  });
  document.addEventListener("fullscreenchange", function () {
    el.slideFull.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
  });
  document.addEventListener("keydown", function (event) {
    if (el.slides.hidden) return;
    var key = event.key;
    if (key === "ArrowRight" || key === "PageDown" || key === " ") goSlide(1);
    else if (key === "ArrowLeft" || key === "PageUp") goSlide(-1);
    else if (key === "Home") goSlide(-state.slideIndex);
    else if (key === "End") goSlide(state.slides.length);
    else if (key === "Escape" && !document.fullscreenElement) closeSlides();
    else if (key === "f" || key === "F") el.slideFull.click();
    else return;
    event.preventDefault();
  });
  var touchX = null;
  el.slides.addEventListener("touchstart", function (event) {
    touchX = event.touches[0].clientX;
  });
  el.slides.addEventListener("touchend", function (event) {
    if (touchX === null) return;
    var dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) goSlide(dx < 0 ? 1 : -1);
  });

  function updatePresentPanel() {
    if (el.panel.hidden) return;
    var url = dashboardUrl();
    if (el.qr.getAttribute("data-url") !== url) {
      el.qr.setAttribute("data-url", url);
      el.qr.src = qrSrc(url);
    }
    el.presentUrl.textContent = url.replace(/^https?:\/\//, "");
    el.presentState.innerHTML = state.isPublic
      ? '<strong class="lnl-dash__open">Open:</strong> attendees who scan this code can see the results now.'
      : '<strong>Private:</strong> scanning the code will show a lock screen until you open the dashboard to attendees.';
    el.publicToggle.textContent = state.isPublic ? "Close to attendees" : "Open to attendees";
    el.publicToggle.disabled = state.demo;
  }

  el.present.addEventListener("click", function () {
    el.panel.hidden = false;
    document.body.classList.add("lnl-dash-presenting");
    updatePresentPanel();
    el.panelClose.focus();
  });

  function closePanel() {
    el.panel.hidden = true;
    document.body.classList.remove("lnl-dash-presenting");
    el.present.focus();
  }

  el.panelClose.addEventListener("click", closePanel);
  el.panel.addEventListener("click", function (event) {
    if (event.target === el.panel) closePanel();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !el.panel.hidden) closePanel();
  });

  el.publicToggle.addEventListener("click", function () {
    var opening = !state.isPublic;
    if (opening && !window.confirm("Open the dashboard to anyone with the link? They will see aggregated results only, with no filters or written answers.")) return;
    load({ publicState: opening ? "on" : "off" });
  });

  // ---------- Wiring ----------

  el.lock.addEventListener("submit", function (event) {
    event.preventDefault();
    var key = el.lock.querySelector("input").value.trim();
    if (!key) return;
    storeKey(key);
    el.lockError.textContent = "";
    load();
  });

  el.refresh.addEventListener("click", function () {
    load();
  });

  el.print.addEventListener("click", function () {
    window.print();
  });

  el.signout.addEventListener("click", function () {
    forgetKey();
    state.records = [];
    showLock("");
  });

  var hashKey = location.hash.match(/(?:^#|&)key=([^&]+)/);
  if (hashKey) {
    storeKey(decodeURIComponent(hashKey[1]));
    history.replaceState(null, "", location.pathname + location.search);
  } else {
    state.key = storedKey();
  }

  load();
  setInterval(function () {
    if (!document.hidden && state.mode && !state.demo) load();
  }, REFRESH_MS);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.mode && !state.demo && Date.now() - state.lastLoaded > REFRESH_MS) load();
  });

  // ---------- Demo data (#demo): synthetic responses for previews and rehearsals ----------

  function demoRecords() {
    var seed = 20261007;
    function rand() {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function pickIndex(weights) {
      var total = weights.reduce(function (a, b) {
        return a + b;
      }, 0);
      var r = rand() * total;
      for (var i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
      }
      return weights.length - 1;
    }
    function opts(id) {
      return questions[id].options;
    }
    function pick(id, weights) {
      var o = opts(id);
      return o[weights ? pickIndex(weights) : Math.floor(rand() * o.length)];
    }
    function clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }
    function noise(scale) {
      return (rand() + rand() + rand() - 1.5) * scale;
    }
    function likert(id, level) {
      var o = opts(id);
      return o[clamp(Math.round(level + noise(1.6)), 0, o.length - 1)];
    }

    var suggestions = [
      "Subsidise meals at the university cafeteria so students can afford lunch",
      "Introduce meal cards or food vouchers for needy students",
      "Start a student food bank on campus",
      "Lower the price of food in the canteen",
      "Give part-time jobs on campus so students can earn money for food",
      "Provide free breakfast before morning lectures",
      "Create a welfare fund for students who run out of money",
      "Allow students to cook in hostels and provide kitchen space",
      "Start a campus garden that supplies vegetables to students",
      "Sensitise students about budgeting and cheap nutritious food",
      "Partner with NGOs and churches to support hungry students",
      "Make bursaries cover food, not only tuition"
    ];
    var start = Date.now() - 9 * 86400000;
    var list = [];
    for (var i = 0; i < 286; i++) {
      var r = {};
      r.CAMPUS = pick("CAMPUS", [65, 35]);
      r.B1 = 18 + Math.floor(Math.pow(rand(), 1.7) * 12);
      r.B2 = pick("B2");
      r.B3 = pick("B3", [30, 26, 22, 17, 5]);
      var schools = questions.B4.optionsBy[r.CAMPUS];
      r.B4 = schools[Math.floor(rand() * schools.length)];
      r.B5 = pick("B5", [15, 85]);
      r.B6 = pick("B6", [38, 62]);
      r.B7 = pick("B7", [92, 6, 2]);
      var income = pickIndex([18, 30, 25, 14, 9, 4]);
      r.C1 = opts("C1")[income];
      r.C2 = pick("C2", [62, 14, 10, 10, 4]);
      if (r.C2 === questions.C2.other) r.C2_other = "Relatives abroad";
      r.C3 = pick("C3", [24, 6, 70]);
      r.C4 = pick("C4", [8, 22, 34, 30, 6]);
      r.C5 = pick("C5", [26, 34, 30, 7, 3]);
      r.C6 = opts("C6")[clamp(Math.round(income / 2.2 + noise(0.9)), 0, 2)];
      r.C7 = opts("C7")[clamp(Math.round(income * 0.8 + noise(1.2)), 0, 4)];

      var hardship =
        0.5 -
        income * 0.09 +
        (r.B6.indexOf("Non-resident") === 0 ? 0.08 : 0) +
        (r.B5 === opts("B5")[1] ? 0.05 : 0) +
        (r.C3 === opts("C3")[2] ? 0.04 : 0) +
        (r.C5 === "Peasant farming" ? 0.06 : 0) +
        noise(0.45);
      hardship = clamp(hardship, 0, 1);

      [0.12, 0.2, 0.24, 0.38, 0.42, 0.55, 0.6, 0.76].forEach(function (threshold, index) {
        r["D" + (index + 1)] = hardship + noise(0.18) > threshold ? "Yes" : "No";
      });

      var groups = opts("F");
      var groupCount = clamp(Math.round(7 - hardship * 5 + noise(1.6)), 1, 10);
      var chosen = [groups[0]];
      var pool = groups.slice(1).sort(function () {
        return rand() - 0.5;
      });
      r.F = chosen.concat(pool.slice(0, groupCount - 1));

      r.G1 = opts("G1")[clamp(Math.round(2.4 - hardship * 2.4 + noise(0.9)), 0, 3)];
      r.G2 = opts("G2").filter(function (option, index) {
        return rand() < [0.45, 0.4, 0.5, 0.12, 0.06 + hardship * 0.1][index];
      });
      if (!r.G2.length) r.G2 = [opts("G2")[2]];
      r.H1 = opts("H1")[clamp(Math.round(hardship * 3.2 - 0.6 + noise(0.9)), 0, 3)];
      if (hardship < 0.22 && rand() < 0.7) r.H2 = [questions.H2.exclusive];
      else {
        r.H2 = opts("H2").filter(function (option, index) {
          return index < 7 && rand() < [0.5, 0.45, 0.6, 0.22, 0.12, 0.08, 0.18][index] * (0.4 + hardship);
        });
        if (!r.H2.length) r.H2 = [opts("H2")[2]];
      }
      ["H3", "H4", "H5"].forEach(function (id) {
        questions[id].rows.forEach(function (row) {
          r[row.id] = likert(row.id, hardship * 4.2 - 0.2);
        });
      });
      r.H6 = opts("H6")[clamp(Math.round(0.8 + hardship * 3 + noise(1.2)), 0, 4)];
      questions.H7.rows.forEach(function (row) {
        r[row.id] = rand() < hardship * 0.7 ? "Yes" : "No";
      });
      questions.I1.rows.forEach(function (row, index) {
        r[row.id] = opts(row.id)[pickIndex([[60, 25, 20, 8, 30][index], [20, 40, 40, 55, 30][index], 30])];
      });
      r.I2 = pick("I2", [12, 60, 28]);
      if (r.I2 === "Yes") r.I2_which = rand() < 0.5 ? "Bursary/welfare fund" : "Subsidised cafeteria";
      if (rand() < 0.62) r.J1 = suggestions[Math.floor(rand() * suggestions.length)];
      var when = new Date(start + Math.pow(rand(), 0.7) * 9 * 86400000);
      r.submitted = when.toISOString().slice(0, 16);
      r.minutes = rand() < 0.05 ? 2 + Math.round(rand() * 25) / 10 : Math.round((8 + rand() * 18) * 10) / 10;
      list.push(r);
    }
    return list;
  }
})();
