const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'submissions.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function save(submission) {
  const all = readAll();
  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt: new Date().toISOString(),
    ...submission,
  };
  all.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), 'utf8');
  return record;
}

module.exports = { readAll, save };
