
const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const DATA_FILE = 'repositories.json';

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

async function syncSheet() {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not configured');
  }

  const repositories = JSON.parse(
    fs.readFileSync(DATA_FILE, 'utf8')
  );

  const rows = [];

  for (const repo of Object.values(repositories)) {
    rows.push([
      repo.name,
      repo.description || '',
      repo.language || '',
      repo.stars ?? 0,
      repo.url,
      repo.date || ''
    ]);
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "'Repositories'!A3:F"
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Repositories'!A3",
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    });
  }

  console.log(`Google Sheets synced: ${rows.length} repositories`);
}

module.exports = { syncSheet };

if (require.main === module) {
  syncSheet().catch(console.error);
}
