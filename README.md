# Lounge.AI WhatsApp Tracker

[Lounge.AI Spreadsheet](https://docs.google.com/spreadsheets/d/1MSeZwXZ9ErnIUDD6uegJ9OaCSQPABbqsjvbB9eK1JBw/edit?usp=sharing)

An automated GitHub repository tracker for the **Lounge.AI WhatsApp community**, built with Node.js.

Lounge Tracker monitors a designated WhatsApp group for GitHub repository links, retrieves project information using the GitHub API, and automatically maintains a public Google Sheets directory.

## Features

- **Automatic detection** of GitHub repository links shared in WhatsApp
- **GitHub API integration** for descriptions, languages and star counts
- **Duplicate prevention** using repository identifiers
- **Local storage** in JSON and CSV formats
- **Google Sheets synchronisation** for a publicly accessible directory
- **Persistent operation** as a Linux systemd service

## Setup

This codebase can be used for *any* WhatsApp group, not just Lounge.AI!

### Requirements

- Node.js 18+
- A WhatsApp account with access to the target group
- A Google Cloud service account with Google Sheets API access
- A Google Sheet shared with the service account as an Editor

### Installation

```bash
git clone https://github.com/Jonah-Crawford/Lounge.AI-Tracker.git
cd Lounge.AI-Tracker
npm install
```

Create a `.env` file:

```env
WA_GROUP_ID=your_group_id@g.us
GOOGLE_SHEET_ID=your_spreadsheet_id
```

Place your Google service account credentials in `service-account.json` and ensure your spreadsheet contains a tab named `Repositories`.

Start the tracker:

```bash
node index.js
```

On first launch, scan the QR code using **WhatsApp → Linked Devices**.

For continuous operation, the tracker can be configured as a systemd service.

## How It Works

```text
WhatsApp Group
      |
      v
GitHub URL Detection
      |
      v
GitHub REST API
      |
      v
Local JSON / CSV
      |
      v
Google Sheets
```

New repositories are automatically added to the directory without manual intervention. Existing repositories are deduplicated, and WhatsApp sender identifiers are excluded from the public spreadsheet.

## Notes

This project uses [whatsapp-web.js](https://wwebjs.dev/), an unofficial WhatsApp Web integration. It is not affiliated with WhatsApp, Meta, GitHub or Lounge.AI.

Use only in groups where automated collection has been authorised. The public directory should contain only information approved for publication.
