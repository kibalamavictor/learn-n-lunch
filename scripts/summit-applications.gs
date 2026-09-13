/**
 * Campus Food Security Summit 2026 — applications inbox
 *
 * Creates two tabs:
 *   Applications  one row per student, with Status + Notes for review
 *   Dashboard     live counts by university, year, interests, and follow-up
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
 */

var SPREADSHEET_ID = "1D-CmKGii0xvxvkAd5vXLUxcvChgQyezOrWBHwne5YDI";
var APPLICATIONS_TAB = "Applications";
var DASHBOARD_TAB = "Dashboard";
var TIMEZONE = "Africa/Nairobi";
var NOTIFY_EMAIL = "info@learnandlunch.org";
var STATUS_VALUES = ["New", "Reviewing", "Selected", "Waitlist", "Not selected", "Follow-up"];

var INTEREST_COLUMNS = [
  { header: "Interest: Student experiences", match: "Student experiences and voices" },
  { header: "Interest: Research", match: "Research and evidence" },
  { header: "Interest: Food and nutrition", match: "Food and nutrition" },
  { header: "Interest: Practical solutions", match: "Practical solutions" },
  { header: "Interest: Student advocacy", match: "Student advocacy and action" },
  { header: "Interest: Policy change", match: "Policy and institutional change" },
  { header: "Interest: Innovation", match: "Innovation and entrepreneurship" }
];

var HEADERS = [
  "Status",
  "Submitted",
  "Full name",
  "Gender",
  "University / institution",
  "Course / programme",
  "Year of study",
  "Phone",
  "Email",
  "Student leader",
  "Role / organisation",
  "Why attend",
  "Witnessed campus food insecurity",
  "Stay involved after summit"
]
  .concat(INTEREST_COLUMNS.map(function (item) {
    return item.header;
  }))
  .concat(["All interests", "Consent", "Notes"]);

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
    var interests = String(data.interests || "");
    var row = [
      "New",
      Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm"),
      String(data.fullName || ""),
      String(data.gender || ""),
      String(data.university || ""),
      String(data.course || ""),
      String(data.yearOfStudy || ""),
      String(data.phone || ""),
      String(data.email || ""),
      String(data.studentLeader || ""),
      String(data.leaderRole || ""),
      String(data.whyAttend || ""),
      String(data.witnessedFoodInsecurity || ""),
      String(data.stayInvolved || "")
    ];

    INTEREST_COLUMNS.forEach(function (item) {
      row.push(interestSelected(interests, item.match) ? "Yes" : "");
    });

    row.push(interests);
    row.push(String(data.consent || ""));
    row.push("");

    sheet.appendRow(row);
    notifyTeam(data);

    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error) });
  }
}

function setupWorkbook() {
  var spreadsheet = getSpreadsheet();
  var applications = spreadsheet.getSheetByName(APPLICATIONS_TAB) || spreadsheet.insertSheet(APPLICATIONS_TAB);
  ensureHeaders(applications);
  styleApplications(applications);
  ensureDashboard(spreadsheet);
}

function ensureHeaders(sheet) {
  var existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var matches = existing.join("") === HEADERS.join("");
  if (!matches) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  sheet.setFrozenRows(1);
}

function styleApplications(sheet) {
  var lastColumn = HEADERS.length;
  var header = sheet.getRange(1, 1, 1, lastColumn);
  header.setFontWeight("bold");
  header.setBackground("#f6c33c");
  header.setFontColor("#000000");
  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(5, 220);
  sheet.setColumnWidth(6, 180);
  sheet.setColumnWidth(12, 320);
  sheet.setColumnWidth(lastColumn, 200);

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_VALUES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("A2:A").setDataValidation(statusRule);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), lastColumn).createFilter();
  }
}

function ensureDashboard(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TAB);
  if (sheet && sheet.getRange("A1").getValue() === "Campus Food Security Summit 2026") {
    return;
  }
  if (!sheet) sheet = spreadsheet.insertSheet(DASHBOARD_TAB);

  sheet.clear();
  sheet.getRange("A1").setValue("Campus Food Security Summit 2026");
  sheet.getRange("A2").setValue("Student applications — live snapshot");
  sheet.getRange("A1:D1").merge().setFontWeight("bold").setFontSize(18);
  sheet.getRange("A2:D2").merge();

  var metrics = [
    ["Metric", "Count"],
    ["Total applications", '=COUNTA(Applications!C2:C)'],
    ["New", '=COUNTIF(Applications!A2:A,"New")'],
    ["Reviewing", '=COUNTIF(Applications!A2:A,"Reviewing")'],
    ["Selected", '=COUNTIF(Applications!A2:A,"Selected")'],
    ["Waitlist", '=COUNTIF(Applications!A2:A,"Waitlist")'],
    ["Not selected", '=COUNTIF(Applications!A2:A,"Not selected")'],
    ["Follow-up", '=COUNTIF(Applications!A2:A,"Follow-up")'],
    ["Student leaders", '=COUNTIF(Applications!J2:J,"Yes")'],
    ["Want to stay involved", '=COUNTIF(Applications!N2:N,"Yes")'],
    ["Maybe stay involved", '=COUNTIF(Applications!N2:N,"Maybe")'],
    ["Witnessed campus food insecurity", '=COUNTIF(Applications!M2:M,"Yes")']
  ];
  sheet.getRange(4, 1, metrics.length, 2).setValues(metrics);
  sheet.getRange("A4:B4").setFontWeight("bold").setBackground("#f6c33c");

  sheet.getRange("A18").setValue("By university");
  sheet.getRange("A18").setFontWeight("bold");
  sheet.getRange("A19").setFormula(
    '=IFERROR(QUERY(Applications!E2:E,"select Col1, count(Col1) where Col1 is not null and Col1 <> \'\' group by Col1 order by count(Col1) desc label Col1 \'University\', count(Col1) \'Applications\'",0),"No applications yet")'
  );

  sheet.getRange("D18").setValue("By year of study");
  sheet.getRange("D18").setFontWeight("bold");
  sheet.getRange("D19").setFormula(
    '=IFERROR(QUERY(Applications!G2:G,"select Col1, count(Col1) where Col1 is not null and Col1 <> \'\' group by Col1 order by count(Col1) desc label Col1 \'Year\', count(Col1) \'Applications\'",0),"No applications yet")'
  );

  sheet.getRange("A40").setValue("What they want from the Summit");
  sheet.getRange("A40").setFontWeight("bold");
  sheet.getRange("A41:B48").setValues([
    ["Interest", "Count"],
    ["Student experiences", '=COUNTIF(Applications!O2:O,"Yes")'],
    ["Research", '=COUNTIF(Applications!P2:P,"Yes")'],
    ["Food and nutrition", '=COUNTIF(Applications!Q2:Q,"Yes")'],
    ["Practical solutions", '=COUNTIF(Applications!R2:R,"Yes")'],
    ["Student advocacy", '=COUNTIF(Applications!S2:S,"Yes")'],
    ["Policy change", '=COUNTIF(Applications!T2:T,"Yes")'],
    ["Innovation", '=COUNTIF(Applications!U2:U,"Yes")']
  ]);
  sheet.getRange("A41:B41").setFontWeight("bold").setBackground("#f6c33c");

  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 140);
}

function interestSelected(interests, label) {
  return interests.split(",").some(function (item) {
    return item.replace(/^\s+|\s+$/g, "") === label;
  });
}

function notifyTeam(data) {
  try {
    var name = data.fullName || "A student";
    var university = data.university || "an unlisted university";
    var sheetUrl = getSpreadsheet().getUrl();
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: "Summit application: " + name,
      body:
        name +
        " from " +
        university +
        " just applied for the Campus Food Security Summit 2026.\n\n" +
        "Open the applications sheet:\n" +
        sheetUrl +
        "\n"
    });
  } catch (error) {
    // Row is already saved; skip email if Gmail permission is missing.
  }
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.TEXT
  );
}
