require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const contactRoutes = require('./routes/contact');
const {
  ADMIN_SESSION_NAME,
  createAdminSession,
  getAdminConfig,
  isValidAdminSession,
  safeEqual,
} = require('./utils/adminSession');

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'cleaning-company' }));

app.post('/api/admin/login', adminLoginLimiter, (req, res) => {
  const adminConfig = getAdminConfig();
  if (!adminConfig) {
    return res.status(503).json({ ok: false, error: 'Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.' });
  }

  const submitted = String(req.body?.password || '').trim();
  if (!safeEqual(submitted, adminConfig.password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  res.cookie(ADMIN_SESSION_NAME, createAdminSession(adminConfig.secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  });

  return res.json({ ok: true, message: 'Admin access granted.' });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(ADMIN_SESSION_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ ok: true, message: 'Logged out.' });
});

app.use('/api/contact', contactRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 fallback
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

// Error handler (catches CORS rejection and unexpected errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Eagle Cleaning Co. backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;