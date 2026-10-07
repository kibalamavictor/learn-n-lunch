// Analysis engine for research dashboards. Runs in the browser (js/research-dashboard.js) and is inlined into the
// study's Google Apps Script (scripts/lib/research/apps-script.js), so it must stay dependency-free ES5.
var StudyAnalytics = (function () {
  var Z = 1.96;
  var STOPWORDS = (
    "about also because been being better could does doing done each every food foods from give given good have " +
    "help into just like make many more most much need needs only other people provide providing should some " +
    "student students such than that their them then there these they this those through university very well " +
    "were what when where which while will with would your kiu kampala international able want things thing " +
    "start create introduce allow lower think"
  ).split(" ");

  function round(value, places) {
    var factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }

  function pct(count, n) {
    return n ? round((count / n) * 100, 1) : null;
  }

  function mean(values) {
    var list = values.filter(function (v) {
      return typeof v === "number" && !isNaN(v);
    });
    if (!list.length) return null;
    return round(
      list.reduce(function (a, b) {
        return a + b;
      }, 0) / list.length,
      2
    );
  }

  function median(values) {
    var list = values
      .filter(function (v) {
        return typeof v === "number" && !isNaN(v);
      })
      .sort(function (a, b) {
        return a - b;
      });
    if (!list.length) return null;
    var mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : round((list[mid - 1] + list[mid]) / 2, 1);
  }

  function asList(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return String(value).split(/;\s*/);
  }

  function has(value) {
    return value !== undefined && value !== null && value !== "";
  }

  /** Proportion with a Wilson 95% confidence interval. */
  function proportion(count, n) {
    if (!n) return { count: 0, n: 0, pct: null, lo: null, hi: null };
    var p = count / n;
    var z2 = Z * Z;
    var denom = 1 + z2 / n;
    var centre = (p + z2 / (2 * n)) / denom;
    var half = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
    return {
      count: count,
      n: n,
      pct: pct(count, n),
      lo: round(Math.max(0, centre - half) * 100, 1),
      hi: round(Math.min(1, centre + half) * 100, 1)
    };
  }

  function lnGamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x;
    var tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    var series = 1.000000000190015;
    for (var j = 0; j < 6; j++) series += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * series) / x);
  }

  /** Upper regularised incomplete gamma Q(a, x), used for chi-square p-values. */
  function gammaQ(a, x) {
    if (x <= 0) return 1;
    var front = Math.exp(-x + a * Math.log(x) - lnGamma(a));
    if (x < a + 1) {
      var ap = a;
      var sum = 1 / a;
      var del = sum;
      for (var n = 0; n < 500; n++) {
        ap += 1;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
      }
      return Math.max(0, 1 - sum * front);
    }
    var tiny = 1e-300;
    var b = x + 1 - a;
    var c = 1 / tiny;
    var d = 1 / b;
    var h = d;
    for (var i = 1; i < 500; i++) {
      var an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < tiny) d = tiny;
      c = b + an / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      var step = d * c;
      h *= step;
      if (Math.abs(step - 1) < 1e-12) break;
    }
    return Math.min(1, front * h);
  }

  /** Pearson chi-square test of independence for a table of [rows][columns] counts. */
  function chiSquare(table) {
    var rows = table.filter(function (row) {
      return row[0] + row[1] > 0;
    });
    if (rows.length < 2) return null;
    var colTotals = [0, 0];
    var total = 0;
    rows.forEach(function (row) {
      colTotals[0] += row[0];
      colTotals[1] += row[1];
      total += row[0] + row[1];
    });
    if (!colTotals[0] || !colTotals[1]) return null;
    var stat = 0;
    var lowExpected = false;
    rows.forEach(function (row) {
      var rowTotal = row[0] + row[1];
      for (var j = 0; j < 2; j++) {
        var expected = (rowTotal * colTotals[j]) / total;
        if (expected < 5) lowExpected = true;
        stat += Math.pow(row[j] - expected, 2) / expected;
      }
    });
    var df = rows.length - 1;
    return { stat: round(stat, 2), df: df, p: round(gammaQ(df / 2, stat / 2), 4), lowExpected: lowExpected };
  }

  function questionMap(study) {
    var map = {};
    study.sections.forEach(function (section) {
      section.questions.forEach(function (q) {
        map[q.id] = q;
        if (q.type === "matrix") {
          q.rows.forEach(function (row) {
            map[row.id] = { id: row.id, short: row.short, text: row.text, type: "radio", options: q.columns, parent: q.id };
          });
        }
        if (q.followUp) map[q.followUp.id] = { id: q.followUp.id, short: q.followUp.short, text: q.followUp.text, type: "text" };
      });
    });
    var bands = (study.analysis && study.analysis.ageBands) || [];
    map.AGE_BAND = {
      id: "AGE_BAND",
      short: "Age group",
      text: "Age group (from B1)",
      type: "radio",
      options: bands.map(function (band) {
        return band.label;
      })
    };
    return map;
  }

  function band(score, categories) {
    for (var i = 0; i < categories.length; i++) {
      if (score <= categories[i].max) return categories[i].label;
    }
    return "";
  }

  function ageBand(age, bands) {
    var value = Number(age);
    if (!has(age) || isNaN(value)) return "";
    return band(value, bands);
  }

  function isFast(record, study) {
    var limit = study.analysis.fastMinutes;
    return typeof record.minutes === "number" && record.minutes < limit;
  }

  /** Adds derived scores without mutating the source records. */
  function prepare(records, study) {
    var fies = study.scoring.fies;
    var idds = study.scoring.idds;
    var moderateMin = fies.categories[1].max + 1;
    var severeMin = fies.categories[2].max + 1;
    var bands = study.analysis.ageBands;
    return records.map(function (source) {
      var r = {};
      for (var key in source) r[key] = source[key];
      r._fies = fies.items.reduce(function (total, id) {
        return total + (r[id] === fies.yes ? 1 : 0);
      }, 0);
      r._band = band(r._fies, fies.categories);
      r._insecure = r._fies >= moderateMin;
      r._severe = r._fies >= severeMin;
      r._idds = asList(r[idds.question]).length;
      r._iddsBand = band(r._idds, idds.categories);
      r.AGE_BAND = ageBand(r.B1, bands);
      return r;
    });
  }

  function filter(records, filters, study, options) {
    var bands = study.analysis.ageBands;
    return records.filter(function (r) {
      for (var id in filters) {
        if (!filters[id]) continue;
        var value = id === "AGE_BAND" ? ageBand(r.B1, bands) : r[id];
        if (value !== filters[id]) return false;
      }
      return !(options && options.excludeFast && isFast(r, study));
    });
  }

  function count(records, test) {
    return records.filter(test).length;
  }

  function suppress(item, minCell) {
    if (minCell && item.n > 0 && item.n < minCell) {
      item.suppressed = true;
      ["count", "pct", "lo", "hi", "mean", "any", "insecure", "meanFies"].forEach(function (key) {
        if (key in item) item[key] = null;
      });
      if (item.parts) item.parts = [];
    }
    return item;
  }

  /** Distribution of a single-choice answer over its options. */
  function dist(records, key, options, minCell) {
    var base = records.filter(function (r) {
      return has(r[key]);
    });
    var n = base.length;
    var items = options.map(function (option) {
      var c = count(base, function (r) {
        return r[key] === option;
      });
      return { label: option, count: c, pct: pct(c, n) };
    });
    if (minCell && n > 0 && n < minCell) {
      items.forEach(function (item) {
        item.count = null;
        item.pct = null;
      });
    }
    return { n: n, items: items };
  }

  /** Share of respondents selecting each option of a multi-select question. */
  function multi(records, key, options, includeBlank) {
    var base = includeBlank
      ? records
      : records.filter(function (r) {
          return asList(r[key]).length > 0;
        });
    var n = base.length;
    return {
      n: n,
      items: options.map(function (option) {
        var c = count(base, function (r) {
          return asList(r[key]).indexOf(option) !== -1;
        });
        return { label: option, count: c, pct: pct(c, n) };
      })
    };
  }

  function histogram(records, key, min, max) {
    var items = [];
    for (var value = min; value <= max; value++) {
      var v = value;
      items.push({
        label: String(v),
        count: count(records, function (r) {
          return r[key] === v;
        })
      });
    }
    return { n: records.length, items: items };
  }

  /** Answer distribution within each food-insecurity band. */
  function byBand(records, key, options, bandLabels, minCell) {
    return bandLabels.map(function (label) {
      var subset = records.filter(function (r) {
        return r._band === label;
      });
      var d = dist(subset, key, options, 0);
      return suppress({ label: label, n: d.n, parts: d.items }, minCell);
    });
  }

  function meanByBand(records, key, bandLabels, minCell) {
    return bandLabels.map(function (label) {
      var subset = records.filter(function (r) {
        return r._band === label;
      });
      return suppress(
        {
          label: label,
          n: subset.length,
          mean: mean(
            subset.map(function (r) {
              return r[key];
            })
          )
        },
        minCell
      );
    });
  }

  /** Moderate-or-severe food insecurity prevalence in each subgroup of a determinant, with a chi-square test. */
  function determinant(records, q, minCell) {
    var rows = q.options.map(function (option) {
      var subset = records.filter(function (r) {
        return r[q.id] === option;
      });
      var insecure = count(subset, function (r) {
        return r._insecure;
      });
      var row = proportion(insecure, subset.length);
      row.label = option;
      row.insecure = insecure;
      row.any = pct(
        count(subset, function (r) {
          return r._fies > 0;
        }),
        subset.length
      );
      row.meanFies = mean(
        subset.map(function (r) {
          return r._fies;
        })
      );
      return row;
    });
    var test = chiSquare(
      rows.map(function (row) {
        return [row.insecure, row.n - row.insecure];
      })
    );
    return {
      id: q.id,
      label: q.short,
      test: test,
      rows: rows.map(function (row) {
        return suppress(row, minCell);
      })
    };
  }

  function matches(value, rule) {
    if (!has(value)) return false;
    if (rule.any) return rule.any.indexOf(value) !== -1;
    if (rule.not) return rule.not.indexOf(value) === -1;
    return false;
  }

  /** An outcome's prevalence among moderately/severely food-insecure students versus everyone else. */
  function outcome(records, rule, minCell) {
    var base = records.filter(function (r) {
      return has(r[rule.id]);
    });
    function share(subset) {
      return proportion(
        count(subset, function (r) {
          return matches(r[rule.id], rule);
        }),
        subset.length
      );
    }
    var insecure = share(
      base.filter(function (r) {
        return r._insecure;
      })
    );
    var others = share(
      base.filter(function (r) {
        return !r._insecure;
      })
    );
    var test = chiSquare([
      [insecure.count, insecure.n - insecure.count],
      [others.count, others.n - others.count]
    ]);
    var result = {
      id: rule.id,
      label: rule.label,
      all: share(base),
      insecure: suppress(insecure, minCell),
      others: suppress(others, minCell),
      ratio: null,
      test: test
    };
    if (!insecure.suppressed && !others.suppressed && others.pct) result.ratio = round(insecure.pct / others.pct, 2);
    return result;
  }

  /** Likert grid: per-item distribution plus a 1–5 index compared across food-insecurity bands. */
  function scale(records, q, bandLabels, minCell) {
    var items = q.rows.map(function (row) {
      var d = dist(records, row.id, q.columns, 0);
      var scores = records
        .filter(function (r) {
          return has(r[row.id]);
        })
        .map(function (r) {
          return q.columns.indexOf(r[row.id]) + 1;
        });
      var top = d.items.slice(-2).reduce(function (sum, item) {
        return sum + item.count;
      }, 0);
      return { id: row.id, label: row.short, n: d.n, parts: d.items, mean: mean(scores), top: pct(top, d.n) };
    });
    var indexed = records.map(function (r) {
      var scores = q.rows
        .filter(function (row) {
          return has(r[row.id]);
        })
        .map(function (row) {
          return q.columns.indexOf(r[row.id]) + 1;
        });
      return { _band: r._band, _index: scores.length === q.rows.length ? mean(scores) : null };
    });
    return {
      id: q.id,
      label: q.text,
      prompt: q.prompt || "",
      columns: q.columns,
      items: items,
      index: mean(
        indexed.map(function (r) {
          return r._index;
        })
      ),
      byBand: meanByBand(indexed, "_index", bandLabels, minCell)
    };
  }

  function timeline(records) {
    var counts = {};
    records.forEach(function (r) {
      var day = String(r.submitted || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) counts[day] = (counts[day] || 0) + 1;
    });
    var days = Object.keys(counts).sort();
    if (!days.length) return { n: 0, items: [] };
    var items = [];
    var cursor = new Date(days[0] + "T00:00:00Z");
    var last = new Date(days[days.length - 1] + "T00:00:00Z");
    var running = 0;
    while (cursor <= last && items.length < 400) {
      var key = cursor.toISOString().slice(0, 10);
      running += counts[key] || 0;
      items.push({ label: key, count: counts[key] || 0, cumulative: running });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { n: running, items: items };
  }

  function keywords(records, key, minCount) {
    var tally = {};
    records.forEach(function (r) {
      var seen = {};
      String(r[key] || "")
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, " ")
        .split(/\s+/)
        .forEach(function (word) {
          word = word.replace(/^['-]+|['-]+$/g, "");
          if (word.length < 4 || STOPWORDS.indexOf(word) !== -1 || seen[word]) return;
          seen[word] = true;
          tally[word] = (tally[word] || 0) + 1;
        });
    });
    return Object.keys(tally)
      .filter(function (word) {
        return tally[word] >= minCount;
      })
      .sort(function (a, b) {
        return tally[b] - tally[a] || (a < b ? -1 : 1);
      })
      .slice(0, 30)
      .map(function (word) {
        return { label: word, count: tally[word] };
      });
  }

  function texts(records, key) {
    return records
      .filter(function (r) {
        return has(r[key]) && String(r[key]).trim().length > 1;
      })
      .sort(function (a, b) {
        return String(b.submitted || "") < String(a.submitted || "") ? -1 : 1;
      })
      .map(function (r) {
        return { text: String(r[key]).trim(), campus: r.CAMPUS || "", band: r._band, submitted: r.submitted || "" };
      });
  }

  function quality(records, study, q) {
    var scaleRows = [];
    study.analysis.scales.forEach(function (id) {
      q[id].rows.forEach(function (row) {
        scaleRows.push(row.id);
      });
    });
    var straight = count(records, function (r) {
      var answers = scaleRows.map(function (id) {
        return q[id].options.indexOf(r[id]);
      });
      return (
        answers.every(function (a) {
          return a !== -1;
        }) &&
        answers.every(function (a) {
          return a === answers[0];
        })
      );
    });
    return {
      n: records.length,
      fast: count(records, function (r) {
        return isFast(r, study);
      }),
      fastMinutes: study.analysis.fastMinutes,
      straightLiners: straight,
      medianMinutes: median(
        records.map(function (r) {
          return r.minutes;
        })
      )
    };
  }

  function analyse(input, study, options) {
    options = options || {};
    var minCell = options.minCell || 0;
    var plan = study.analysis;
    var q = questionMap(study);
    var fies = study.scoring.fies;
    var idds = study.scoring.idds;
    var bandLabels = fies.categories.map(function (c) {
      return c.label;
    });
    var iddsLabels = idds.categories.map(function (c) {
      return c.label;
    });
    var records = prepare(input, study);
    var n = records.length;
    var insecureCount = count(records, function (r) {
      return r._insecure;
    });

    function fiesValues(key) {
      return records.map(function (r) {
        return r[key];
      });
    }

    var outcomes = plan.outcomes.map(function (rule) {
      return outcome(records, rule, minCell);
    });

    return {
      n: n,
      minCell: minCell,
      bands: bandLabels,
      iddsBands: iddsLabels,
      kpis: {
        insecure: proportion(insecureCount, n),
        severe: proportion(
          count(records, function (r) {
            return r._severe;
          }),
          n
        ),
        any: proportion(
          count(records, function (r) {
            return r._fies > 0;
          }),
          n
        ),
        meanFies: mean(fiesValues("_fies")),
        meanIdds: mean(fiesValues("_idds")),
        lowDiversity: proportion(
          count(records, function (r) {
            return r._iddsBand === iddsLabels[0];
          }),
          n
        )
      },
      timeline: timeline(records),
      sample: plan.sample.map(function (id) {
        return { id: id, label: q[id].short, dist: dist(records, id, q[id].options, minCell) };
      }),
      fies: {
        bands: dist(records, "_band", bandLabels, minCell),
        items: fies.items.map(function (id) {
          var yes = count(records, function (r) {
            return r[id] === fies.yes;
          });
          return { id: id, label: q[id].short, count: yes, pct: pct(yes, n) };
        }),
        scores: histogram(records, "_fies", 0, fies.items.length),
        iddsByBand: meanByBand(records, "_idds", bandLabels, minCell)
      },
      idds: {
        bands: dist(records, "_iddsBand", iddsLabels, minCell),
        scores: histogram(records, "_idds", 0, q[idds.question].options.length),
        groups: multi(records, idds.question, q[idds.question].options, true)
      },
      determinants: plan.determinants.map(function (group) {
        return {
          group: group.group,
          items: group.ids.map(function (id) {
            return determinant(records, q[id], minCell);
          })
        };
      }),
      outcomes: outcomes,
      diet: {
        meals: dist(records, plan.diet.meals, q[plan.diet.meals].options, minCell),
        mealsByBand: byBand(records, plan.diet.meals, q[plan.diet.meals].options, bandLabels, minCell),
        places: multi(records, plan.diet.places, q[plan.diet.places].options, false)
      },
      consequences: {
        lectures: dist(records, plan.consequences.lectures, q[plan.consequences.lectures].options, minCell),
        lecturesByBand: byBand(records, plan.consequences.lectures, q[plan.consequences.lectures].options, bandLabels, minCell),
        coping: multi(records, plan.consequences.coping, q[plan.consequences.coping].options, false),
        scales: plan.scales.map(function (id) {
          return scale(records, q[id], bandLabels, minCell);
        }),
        health: dist(records, plan.consequences.health, q[plan.consequences.health].options, minCell),
        healthByBand: byBand(records, plan.consequences.health, q[plan.consequences.health].options, bandLabels, minCell),
        social: q[plan.consequences.social].rows.map(function (row) {
          return outcome(records, { id: row.id, label: row.short, any: ["Yes"] }, minCell);
        })
      },
      support: {
        awareness: q[plan.support.awareness].rows.map(function (row) {
          var d = dist(records, row.id, q[row.id].options, 0);
          return { id: row.id, label: row.short, n: d.n, parts: d.items };
        }),
        accessed: dist(records, plan.support.accessed, q[plan.support.accessed].options, minCell),
        accessedByBand: byBand(records, plan.support.accessed, q[plan.support.accessed].options, bandLabels, minCell)
      },
      voices: {
        responses: count(records, function (r) {
          return has(r[plan.voices.recommendations]);
        }),
        keywords: keywords(records, plan.voices.recommendations, options.includeText ? 1 : Math.max(2, minCell)),
        recommendations: options.includeText ? texts(records, plan.voices.recommendations) : null,
        programmes: options.includeText ? texts(records, plan.voices.programmes) : null
      },
      quality: quality(records, study, q)
    };
  }

  return {
    analyse: analyse,
    filter: filter,
    questionMap: questionMap,
    chiSquare: chiSquare,
    proportion: proportion
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = StudyAnalytics;
