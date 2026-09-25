const crypto = require('crypto');

const ADMIN_SESSION_NAME = 'eagle_admin_session';

function getAdminConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  return password && secret ? { password, secret } : null;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createAdminSession(secret) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const nonce = crypto.randomBytes(32).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function isValidAdminSession(cookieHeader, secret) {
  const match = String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_NAME}=`));

  if (!match) return false;

  let value;
  try {
    value = decodeURIComponent(match.slice(ADMIN_SESSION_NAME.length + 1));
  } catch {
    return false;
  }

  const [expiresAt, nonce, signature] = value.split('.');
  if (!/^\d+$/.test(expiresAt || '') || !/^[a-f0-9]{64}$/.test(nonce || '') || !signature) return false;
  if (Number(expiresAt) <= Date.now()) return false;

  const payload = `${expiresAt}.${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return safeEqual(signature, expected);
}

module.exports = {
  ADMIN_SESSION_NAME,
  createAdminSession,
  getAdminConfig,
  isValidAdminSession,
  safeEqual,
};