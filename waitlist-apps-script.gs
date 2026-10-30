/**
 * tapkit — waitlist collector (Google Apps Script)
 *
 * Paste this into a Google Sheet via Extensions → Apps Script, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web-app URL into WAITLIST_ENDPOINT at the top of the waitlist
 * section in script.js. Full steps: README → "Getting the responses".
 *
 * Each signup arrives twice: once with just the email/WhatsApp (stage
 * "contact"), then again with the answers (stage "complete"). Both carry the
 * same lead_id, so the second one fills in the same row. Rows still on
 * "contact" are people who left before answering the questions.
 */

const SHEET_NAME = 'Waitlist';
const COLUMNS = ['submitted_at', 'updated_at', 'lead_id', 'stage', 'contact', 'contact_type', 'handle', 'niche', 'followers', 'tool', 'brand_deals', 'source', 'ref', 'page'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // two signups at the same moment won't overwrite each other
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.setFrozenRows(1);
    }
    const p = (e && e.parameter) || {};
    p.updated_at = new Date().toISOString();

    const row = findRow(sheet, p.lead_id);
    if (row) {
      // keep the first submitted_at, fill in everything else
      const current = sheet.getRange(row, 1, 1, COLUMNS.length).getValues()[0];
      const next = COLUMNS.map(function (c, i) {
        return c === 'submitted_at' || p[c] == null || p[c] === '' ? current[i] : safe(p[c]);
      });
      sheet.getRange(row, 1, 1, COLUMNS.length).setValues([next]);
      return json({ ok: true, row: row - 1, updated: true });
    }
    sheet.appendRow(COLUMNS.map(function (c) { return safe(p[c]); }));
    return json({ ok: true, row: sheet.getLastRow() - 1 });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Sheet row number holding this lead_id, or 0.
function findRow(sheet, leadId) {
  if (!leadId || sheet.getLastRow() < 2) return 0;
  const col = COLUMNS.indexOf('lead_id') + 1;
  const ids = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(leadId)) return i + 2;
  }
  return 0;
}

// Open the web-app URL in a browser to check the deployment is live.
function doGet() {
  return json({ ok: true, message: 'tapkit waitlist endpoint is running' });
}

// Keep visitor input as plain text: a value starting with = + - @ would
// otherwise be treated as a spreadsheet formula.
function safe(value) {
  const v = String(value == null ? '' : value).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
