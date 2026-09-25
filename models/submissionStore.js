const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'submissions.json');
const UPSTASH_KEY = 'cleaning-company:submissions';

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function runUpstashCommand(command) {
  const config = getUpstashConfig();
  if (!config) {
    const error = new Error('Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for persistent Vercel storage.');
    error.code = 'STORAGE_CONFIG';
    throw error;
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error('Persistent lead storage request failed.');
  }

  return result.result;
}

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

async function readAll() {
  if (process.env.VERCEL) {
    const items = await runUpstashCommand(['LRANGE', UPSTASH_KEY, '0', '-1']);
    return (items || []).map((item) => JSON.parse(item));
  }

  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function save(submission) {
  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt: new Date().toISOString(),
    ...submission,
  };

  if (process.env.VERCEL) {
    await runUpstashCommand(['LPUSH', UPSTASH_KEY, JSON.stringify(record)]);
    return record;
  }

  const all = await readAll();
  all.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), 'utf8');
  return record;
}

module.exports = { readAll, save };
