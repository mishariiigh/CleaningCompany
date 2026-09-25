const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitQuoteRequest, listSubmissions } = require('../controllers/contactController');
const { getAdminConfig, isValidAdminSession } = require('../utils/adminSession');

const router = express.Router();

function requireAdmin(req, res, next) {
  const adminConfig = getAdminConfig();
  if (!adminConfig) {
    return res.status(503).json({ ok: false, error: 'Admin login is not configured.' });
  }

  if (isValidAdminSession(req.headers.cookie, adminConfig.secret)) {
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
