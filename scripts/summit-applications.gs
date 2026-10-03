/**
 * Campus Food Security Summit 2026 — student registrations inbox
 *
 * Creates two tabs for the current registration form:
 *   Registrations            one row per student, with Status + Notes for review
 *   Registrations Dashboard  live counts by university, year, interests, challenges, and follow-up
 *
 * The earlier form's "Applications" and "Dashboard" tabs are left untouched.
 *
 * Bound to this workbook:
 * https://docs.google.com/spreadsheets/d/1D-CmKGii0xvxvkAd5vXLUxcvChgQyezOrWBHwne5YDI/edit
 *
 * Setup (once), signed into the Learn n'lunch Google account:
 * 1. Open the spreadsheet above
 * 2. Extensions → Apps Script
 * 3. Delete any default code and paste this entire file
 * 4. Save, then Run → setupWorkbook (Authorize when Google asks)
 * 5. Deploy → New deployment → Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 6. Copy the web app URL into content/pages/summit.md as submitEndpoint
 * 7. Rebuild the site
 *
 * Updating an existing deployment (keeps the same URL):
 * 1. Paste this file over the old code and Save
 * 2. Run → setupWorkbook
 * 3. Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy
 *
 * Rows are written by header name. If a column is added to the form later, it is inserted
 * before "Notes"; existing rows are left untouched.
 */

var SPREADSHEET_ID = "1D-CmKGii0xvxvkAd5vXLUxcvChgQyezOrWBHwne5YDI";
var APPLICATIONS_TAB = "Registrations";
var DASHBOARD_TAB = "Registrations Dashboard";
var DASHBOARD_SUBTITLE = "Student registrations — live snapshot";
var TIMEZONE = "Africa/Nairobi";
var STATUS_VALUES = ["New", "Reviewing", "Selected", "Waitlist", "Not selected", "Follow-up"];
var NOTES_HEADER = "Notes";

// Form labels must match js/summit-register.js and scripts/lib/pages/summit.js.
var INTEREST_COLUMNS = [
  { header: "Interest: Student experiences", match: "Student experiences and voices" },
  { header: "Interest: Food access", match: "Food access and affordability" },
  { header: "Interest: Nutrition", match: "Nutrition and healthy diets" },
  { header: "Interest: Research", match: "Research and evidence" },
  { header: "Interest: Practical solutions", match: "Practical campus solutions" },
  { header: "Interest: Student advocacy", match: "Student advocacy" },
  { header: "Interest: Policy change", match: "Policy and institutional change" },
  { header: "Interest: Innovation", match: "Innovation and entrepreneurship" }
];

var FOOD_CHALLENGES = [
  "High food prices",
  "Limited affordable food options",
  "Limited nutritious food options",
  "Poor food quality",
  "Food safety or hygiene concerns",
  "Limited access to safe drinking water",
  "Financial difficulties affecting access to food",
  "I have not experienced or observed these challenges",
  "Other"
];

var CONTRIBUTIONS = [
  "Student dialogues and activities",
  "Mobilising other students",
  "Research and evidence gathering",
  "Student advocacy",
  "Communication and storytelling",
  "Developing practical solutions",
  "Through my Guild or student club/association",
  "I would like to learn more before deciding"
];

var COLUMNS = [
  { header: "Status", value: function () { return "New"; } },
  {
    header: "Submitted",
    value: function () {
      return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm");
    }
  },
  { header: "Full name", key: "fullName" },
  { header: "Gender", key: "gender" },
  { header: "University / institution", key: "university" },
  { header: "Course / programme", key: "course" },
  { header: "Year of study", key: "yearOfStudy" },
  { header: "Phone", key: "phone" },
  { header: "Email", key: "email" },
  { header: "Experienced food access challenges", key: "experiencedFoodChallenges" },
  { header: "Campus food challenges", key: "campusFoodChallenges" },
  { header: "Campus food challenges (other)", key: "campusFoodChallengesOther" },
  { header: "One thing to change", key: "oneChange" },
  { header: "Student leader", key: "studentLeader" },
  { header: "Role / organisation", key: "leaderRole" }
]
  .concat(
    INTEREST_COLUMNS.map(function (item) {
      return {
        header: item.header,
        value: function (data) {
          return listIncludes(data.interests, item.match) ? "Yes" : "";
        }
      };
    })
  )
  .concat([
    { header: "All interests", key: "interests" },
    { header: "Question for decision-makers", key: "leaderQuestion" },
    { header: "Stay involved after summit", key: "stayInvolved" },
    { header: "How they would contribute", key: "contribution" },
    { header: "Consent", key: "consent" },
    { header: NOTES_HEADER, value: function () { return ""; } }
  ]);

var HEADERS = COLUMNS.map(function (column) {
  return column.header;
});

function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getId() === SPREADSHEET_ID) return active;
  } catch (error) {
    // Standalone deployments are not bound to a spreadsheet.
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet() {
  setupWorkbook();
  return jsonOutput({ ok: true, message: "Summit applications endpoint is live." });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    setupWorkbook();

    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput({ ok: false, error: "Empty body" });
    }

    var data = JSON.parse(e.postData.contents);
    if (data._gotcha) {
      return jsonOutput({ ok: true, ignored: true });
    }

    var sheet = getSpreadsheet().getSheetByName(APPLICATIONS_TAB);
    var headers = readHeaders(sheet);
    if (isRecentDuplicate(sheet, headers, data)) {
      return jsonOutput({ ok: true, duplicate: true });
    }

    var values = {};
    COLUMNS.forEach(function (column) {
      values[column.header] = column.value ? column.value(data) : String(data[column.key] || "");
    });

    sheet.appendRow(
      headers.map(function (header) {
        return Object.prototype.hasOwnProperty.call(values, header) ? values[header] : "";
      })
    );

    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function readHeaders(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return [];
  return sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function (value) {
      return String(value || "").replace(/^\s+|\s+$/g, "");
    });
}

function columnIndex(headers, header) {
  return headers.indexOf(header) + 1;
}

function columnLetter(index) {
  var letters = "";
  while (index > 0) {
    var remainder = (index - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    index = Math.floor((index - 1) / 26);
  }
  return letters;
}

function normalizeValue(value) {
  return String(value || "").replace(/^\s+|\s+$/g, "").toLowerCase();
}

function parseSubmitted(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  var text = String(value || "");
  var match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    0
  );
}

function isRecentDuplicate(sheet, headers, data) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var email = normalizeValue(data.email);
  var name = normalizeValue(data.fullName);
  var phone = normalizeValue(data.phone).replace(/[^\d+]/g, "");
  if (!email && !name && !phone) return false;

  var submittedCol = headers.indexOf("Submitted");
  var nameCol = headers.indexOf("Full name");
  var phoneCol = headers.indexOf("Phone");
  var emailCol = headers.indexOf("Email");
  if (submittedCol < 0) return false;

  var lookback = Math.min(40, lastRow - 1);
  var values = sheet.getRange(lastRow - lookback + 1, 1, lookback, headers.length).getValues();
  var cutoff = new Date().getTime() - 15 * 60 * 1000;

  for (var i = 0; i < values.length; i++) {
    var submitted = parseSubmitted(values[i][submittedCol]);
    if (!submitted || submitted.getTime() < cutoff) continue;

    var rowName = nameCol < 0 ? "" : normalizeValue(values[i][nameCol]);
    var rowPhone = phoneCol < 0 ? "" : normalizeValue(values[i][phoneCol]).replace(/[^\d+]/g, "");
    var rowEmail = emailCol < 0 ? "" : normalizeValue(values[i][emailCol]);
    var sameEmail = email && rowEmail === email;
    var sameNamePhone = name && phone && rowName === name && rowPhone === phone;
    if (sameEmail || sameNamePhone) return true;
  }

  return false;
}

function setupWorkbook() {
  var spreadsheet = getSpreadsheet();
  var applications = spreadsheet.getSheetByName(APPLICATIONS_TAB) || spreadsheet.insertSheet(APPLICATIONS_TAB);
  var changed = ensureHeaders(applications);
  if (changed) styleApplications(applications);
  ensureDashboard(spreadsheet, readHeaders(applications), changed);
}

/** Adds any missing columns without moving existing data. Returns true if the header row changed. */
function ensureHeaders(sheet) {
  var existing = readHeaders(sheet);
  var hasHeaders = existing.some(function (header) {
    return header !== "";
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return true;
  }

  var missing = HEADERS.filter(function (header) {
    return existing.indexOf(header) === -1;
  });
  if (!missing.length) return false;

  var notesCol = columnIndex(existing, NOTES_HEADER);
  if (notesCol > 0 && missing.indexOf(NOTES_HEADER) === -1) {
    sheet.insertColumnsBefore(notesCol, missing.length);
    sheet.getRange(1, notesCol, 1, missing.length).setValues([missing]);
  } else {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
  return true;
}

function styleApplications(sheet) {
  var headers = readHeaders(sheet);
  var lastColumn = headers.length;
  var header = sheet.getRange(1, 1, 1, lastColumn);
  header.setFontWeight("bold");
  header.setBackground("#f6c33c");
  header.setFontColor("#000000");

  var widths = {
    Status: 130,
    Submitted: 140,
    "Full name": 180,
    "University / institution": 220,
    "Course / programme": 180,
    "Campus food challenges": 320,
    "One thing to change": 280,
    "Question for decision-makers": 320,
    "How they would contribute": 280,
    Notes: 200
  };
  Object.keys(widths).forEach(function (name) {
    var index = columnIndex(headers, name);
    if (index > 0) sheet.setColumnWidth(index, widths[name]);
  });

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_VALUES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("A2:A").setDataValidation(statusRule);

  var filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), lastColumn).createFilter();
}

function ensureDashboard(spreadsheet, headers, force) {
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TAB);
  if (!force && sheet && sheet.getRange("A2").getValue() === DASHBOARD_SUBTITLE) {
    return;
  }
  if (!sheet) sheet = spreadsheet.insertSheet(DASHBOARD_TAB);

  function col(header) {
    var index = columnIndex(headers, header);
    return index > 0 ? "'" + APPLICATIONS_TAB + "'!" + columnLetter(index) + "2:" + columnLetter(index) : null;
  }

  function countIf(header, criterion) {
    var range = col(header);
    return range ? "=COUNTIF(" + range + ',"' + criterion + '")' : 0;
  }

  function writeTable(row, column, title, rows) {
    sheet.getRange(row, column).setValue(title).setFontWeight("bold");
    sheet.getRange(row + 1, column, rows.length, 2).setValues(rows);
    sheet.getRange(row + 1, column, 1, 2).setFontWeight("bold").setBackground("#f6c33c");
  }

  function groupQuery(header, label) {
    var range = col(header);
    if (!range) return "No data";
    return (
      "=IFERROR(QUERY(" +
      range +
      ",\"select Col1, count(Col1) where Col1 is not null and Col1 <> '' group by Col1 order by count(Col1) desc label Col1 '" +
      label +
      "', count(Col1) 'Applications'\",0),\"No applications yet\")"
    );
  }

  sheet.clear();
  sheet.getRange("A1").setValue("Campus Food Security Summit 2026");
  sheet.getRange("A2").setValue(DASHBOARD_SUBTITLE);
  sheet.getRange("A1:E1").merge().setFontWeight("bold").setFontSize(18);
  sheet.getRange("A2:E2").merge();

  writeTable(4, 1, "Overview", [
    ["Metric", "Count"],
    ["Total applications", "=COUNTA(" + col("Full name") + ")"],
    ["New", countIf("Status", "New")],
    ["Reviewing", countIf("Status", "Reviewing")],
    ["Selected", countIf("Status", "Selected")],
    ["Waitlist", countIf("Status", "Waitlist")],
    ["Not selected", countIf("Status", "Not selected")],
    ["Follow-up", countIf("Status", "Follow-up")],
    ["Personally experienced food challenges", countIf("Experienced food access challenges", "Yes")],
    ["Student leaders", countIf("Student leader", "Yes")],
    ["Want to stay involved", countIf("Stay involved after summit", "Yes")],
    ["Maybe stay involved", countIf("Stay involved after summit", "Maybe*")]
  ]);

  writeTable(
    4,
    4,
    "What they want to engage with",
    [["Interest", "Count"]].concat(
      INTEREST_COLUMNS.map(function (item) {
        return [item.match, countIf(item.header, "Yes")];
      })
    )
  );

  writeTable(
    19,
    1,
    "Common campus food challenges",
    [["Challenge", "Count"]].concat(
      FOOD_CHALLENGES.map(function (label) {
        return [label, countIf("Campus food challenges", "*" + label + "*")];
      })
    )
  );

  writeTable(
    19,
    4,
    "How they would contribute",
    [["Contribution", "Count"]].concat(
      CONTRIBUTIONS.map(function (label) {
        return [label, countIf("How they would contribute", "*" + label + "*")];
      })
    )
  );

  sheet.getRange("A32").setValue("By university").setFontWeight("bold");
  sheet.getRange("A33").setFormula(groupQuery("University / institution", "University"));
  sheet.getRange("D32").setValue("By year of study").setFontWeight("bold");
  sheet.getRange("D33").setFormula(groupQuery("Year of study", "Year"));

  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 30);
  sheet.setColumnWidth(4, 320);
  sheet.setColumnWidth(5, 100);
}

function listIncludes(list, label) {
  return String(list || "")
    .split(",")
    .some(function (item) {
      return item.replace(/^\s+|\s+$/g, "") === label;
    });
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.TEXT
  );
}
