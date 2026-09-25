require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const path = require('path');
const cors = require('cors');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ADMIN_SESSION_NAME = 'eagle_admin_session';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function signSession(value) {
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(value).digest('hex');
}

function isValidAdminSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_NAME}=`));
  if (!match) return false;

  const rawValue = decodeURIComponent(match.split('=')[1] || '');
  const [token, signature] = rawValue.split('.');
  if (!token || !signature) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signSession(token))) && token === ADMIN_PASSWORD;
}

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

app.post('/api/admin/login', (req, res) => {
  const submitted = String(req.body?.password || '').trim();
  if (submitted !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  const token = `${ADMIN_PASSWORD}.${signSession(ADMIN_PASSWORD)}`;
  res.cookie(ADMIN_SESSION_NAME, token, {
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