const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitQuoteRequest, listSubmissions } = require('../controllers/contactController');

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ADMIN_SESSION_NAME = 'eagle_admin_session';

function signSession(value) {
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(value).digest('hex');
}

function requireAdmin(req, res, next) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_NAME}=`));

  if (!match) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  const rawValue = decodeURIComponent(match.split('=')[1] || '');
  const [token, signature] = rawValue.split('.');

  if (token && signature && token === ADMIN_PASSWORD && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signSession(token)))) {
    return next();
  }

  return res.status(401).json({ ok: false, error: 'Unauthorized.' });
}

// Limit to 10 submissions per 15 minutes per IP to deter spam/abuse
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' },
});

// POST /api/contact  -> public, used by the website's quote form
router.post('/', submitLimiter, submitQuoteRequest);

// GET /api/contact  -> admin-only access
router.get('/', requireAdmin, listSubmissions);

module.exports = router;
