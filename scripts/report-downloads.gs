/**
 * Impact page — report download leads + private PDF delivery
 *
 * Records everyone who downloads the Strategic Framework or Impact Report, then
 * sends the PDF back from a private Google Drive folder. The PDFs are never
 * published on the website or in the GitHub repo.
 *
 * Creates two tabs:
 *   Downloads  one row per download (first-time form fills and returning visitors)
 *   Summary    live counts by report and organisation
 *
 * Setup (once), signed into the Learn n'lunch Google account:
 * 1. Create a new Google Sheet, e.g. "Report downloads"
 * 2. Extensions → Apps Script
 * 3. Delete any default code and paste this entire file
 * 4. Upload the PDFs to a Google Drive folder that is NOT shared with anyone.
 *    For each PDF: right-click → Share → Copy link. The file ID is the long
 *    code between /d/ and /view. Paste each ID into REPORT_FILES below
 *    (in the Apps Script editor only — keep the placeholders in the repo copy).
 * 5. Save, then Run → setupWorkbook (Authorize when Google asks; allow Drive access)
 * 6. First deployment: Deploy → New deployment → Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 *    Updating an existing deployment (keeps the same URL):
 *      Deploy → Manage deployments → pencil icon → Version: New version → Deploy
 * 7. Copy the web app URL into content/pages/impact.md as downloadForm.submitEndpoint
 *    (or paste it in the CMS: Impact → Download Form → Google Sheet Web App URL)
 * 8. Rebuild the site
 *
 * Publishing a new edition later: in Drive, right-click the PDF → File information →
 * Manage versions → Upload new version. The file ID stays the same, so nothing
 * else needs to change.
 */

var DOWNLOADS_TAB = "Downloads";
var SUMMARY_TAB = "Summary";
var TIMEZONE = "Africa/Nairobi";

// Keys match the Impact page cards. Values are Google Drive file IDs.
var REPORT_FILES = {
  framework: "PASTE_STRATEGIC_FRAMEWORK_FILE_ID",
  report: "PASTE_IMPACT_REPORT_FILE_ID"
};

var HEADERS = [
  "Submitted",
  "Report",
  "First name",
  "Last name",
  "College / organisation",
  "Email",
  "Returning visitor",
  "Page"
];

function doGet() {
  setupWorkbook();
  return jsonOutput({ ok: true, message: "Report downloads endpoint is live." });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput({ ok: false, error: "Empty body" });
    }

    var data = JSON.parse(e.postData.contents);
    if (data._gotcha) {
      return jsonOutput({ ok: false, error: "Rejected" });
    }

    var fileId = REPORT_FILES[String(data.reportKey || "")];
    if (!fileId || fileId.indexOf("PASTE_") === 0) {
      return jsonOutput({ ok: false, error: "Unknown report" });
    }

    if (!String(data.firstName || "").trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || "").trim())) {
      return jsonOutput({ ok: false, error: "First name and a valid email are required" });
    }

    recordDownload(data);

    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    return jsonOutput({
      ok: true,
      fileName: file.getName(),
      mimeType: blob.getContentType() || "application/pdf",
      data: Utilities.base64Encode(blob.getBytes())
    });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error) });
  }
}

function recordDownload(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    setupWorkbook();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DOWNLOADS_TAB);
    if (isRecentDuplicate(sheet, data)) return;

    sheet.appendRow([
      Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm"),
      String(data.report || ""),
      String(data.firstName || ""),
      String(data.lastName || ""),
      String(data.organization || ""),
      String(data.email || ""),
      String(data.returning || "No"),
      String(data.page || "")
    ]);
  } finally {
    lock.releaseLock();
  }
}

function normalizeValue(value) {
  return String(value || "").replace(/^\s+|\s+$/g, "").toLowerCase();
}

function isRecentDuplicate(sheet, data) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var email = normalizeValue(data.email);
  var report = normalizeValue(data.report);
  if (!email) return false;

  var lookback = Math.min(40, lastRow - 1);
  var values = sheet.getRange(lastRow - lookback + 1, 1, lookback, 6).getValues();
  var cutoff = new Date().getTime() - 10 * 60 * 1000;

  for (var i = 0; i < values.length; i++) {
    var submitted = values[i][0] instanceof Date ? values[i][0] : new Date(String(values[i][0]).replace(" ", "T"));
    if (isNaN(submitted.getTime()) || submitted.getTime() < cutoff) continue;
    if (normalizeValue(values[i][5]) === email && normalizeValue(values[i][1]) === report) return true;
  }

  return false;
}

function setupWorkbook() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var downloads = spreadsheet.getSheetByName(DOWNLOADS_TAB) || spreadsheet.insertSheet(DOWNLOADS_TAB);

  var existing = downloads.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (existing.join("") !== HEADERS.join("")) {
    downloads.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  downloads.setFrozenRows(1);
  downloads.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#7be4d3");
  downloads.setColumnWidth(1, 140);
  downloads.setColumnWidth(2, 200);
  downloads.setColumnWidth(5, 220);
  downloads.setColumnWidth(6, 220);
  if (!downloads.getFilter()) {
    downloads.getRange(1, 1, Math.max(downloads.getLastRow(), 2), HEADERS.length).createFilter();
  }

  ensureSummary(spreadsheet);
}

function ensureSummary(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(SUMMARY_TAB);
  if (sheet && sheet.getRange("A1").getValue() === "Report downloads") return;
  if (!sheet) sheet = spreadsheet.insertSheet(SUMMARY_TAB);

  sheet.clear();
  sheet.getRange("A1").setValue("Report downloads").setFontWeight("bold").setFontSize(18);

  sheet.getRange("A3:B6").setValues([
    ["Metric", "Count"],
    ["Total downloads", "=COUNTA(Downloads!B2:B)"],
    ["Unique people", '=IFERROR(COUNTUNIQUE(FILTER(LOWER(Downloads!F2:F),Downloads!F2:F<>"")),0)'],
    ["First-time form fills", '=COUNTIF(Downloads!G2:G,"No")']
  ]);
  sheet.getRange("A3:B3").setFontWeight("bold").setBackground("#7be4d3");

  sheet.getRange("A9").setValue("By report").setFontWeight("bold");
  sheet.getRange("A10").setFormula(
    '=IFERROR(QUERY(Downloads!B2:B,"select Col1, count(Col1) where Col1 is not null and Col1 <> \'\' group by Col1 order by count(Col1) desc label Col1 \'Report\', count(Col1) \'Downloads\'",0),"No downloads yet")'
  );

  sheet.getRange("D9").setValue("By organisation").setFontWeight("bold");
  sheet.getRange("D10").setFormula(
    '=IFERROR(QUERY(Downloads!E2:E,"select Col1, count(Col1) where Col1 is not null and Col1 <> \'\' group by Col1 order by count(Col1) desc label Col1 \'Organisation\', count(Col1) \'Downloads\'",0),"No downloads yet")'
  );

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(4, 240);
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.TEXT);
}
