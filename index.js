
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const TARGET_GROUP = process.env.WA_GROUP_ID || '';
const DATA_FILE = 'repositories.json';
const CSV_FILE = 'repositories.csv';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  }
});

let repositories = {};

if (fs.existsSync(DATA_FILE)) {
  repositories = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function extractRepos(message) {
  const regex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)/gi;
  const results = new Set();

  for (const match of message.matchAll(regex)) {
    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, '');

    if (repo === '.' || repo === '..') continue;

    results.add(`${owner}/${repo}`);
  }

  return [...results];
}

function escapeCSV(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(repositories, null, 2));

  const columns = [
    'Repository', 'URL', 'Description',
    'Language', 'Stars', 'Shared By', 'Date'
  ];

  const lines = [columns.map(escapeCSV).join(',')];

  for (const item of Object.values(repositories)) {
    lines.push([
      item.name,
      item.url,
      item.description,
      item.language,
      item.stars,
      item.sharedBy,
      item.date
    ].map(escapeCSV).join(','));
  }

  fs.writeFileSync(CSV_FILE, lines.join('\r\n'), 'utf8');
}

async function fetchRepo(name) {
  const response = await fetch(
    `https://api.github.com/repos/${name}`,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'lounge-repo-tracker'
      }
    }
  );

  if (!response.ok) {
    console.log(`GitHub returned ${response.status}: ${name}`);
    return null;
  }

  return await response.json();
}

async function processMessage(msg) {
  if (!TARGET_GROUP || msg.from !== TARGET_GROUP) return;

  const found = extractRepos(msg.body || '');

  for (const name of found) {
    const key = name.toLowerCase();

    if (repositories[key]) continue;

    try {
      const repo = await fetchRepo(name);

      if (!repo || repo.private) continue;

      repositories[key] = {
        name: repo.full_name,
        url: repo.html_url,
        description: repo.description || '',
        language: repo.language || '',
        stars: repo.stargazers_count,
        sharedBy: msg.author || 'Unknown',
        date: new Date(msg.timestamp * 1000).toISOString()
      };

      save();
      console.log(`Added: ${repo.full_name}`);
    } catch (error) {
      console.error(`Failed to process ${name}:`, error.message);
    }
  }
}

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp connected!');
  console.log('Listening for incoming messages...');
});

client.on('message', async msg => {
  if (msg.from !== TARGET_GROUP) return;

  const repos = extractRepos(msg.body || '');

  if (repos.length === 0) return;

  console.log(`Found ${repos.length} GitHub repository link(s)`);

  try {
    await processMessage(msg);
  } catch (error) {
    console.error('Processing failed:', error);
  }
});

client.on('disconnected', reason => {
  console.log('WhatsApp disconnected:', reason);
});

client.initialize();
