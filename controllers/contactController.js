const submissionStore = require('../models/submissionStore');
const { sendQuoteNotification } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SERVICES = [
  'Residential Cleaning',
  'Commercial Cleaning',
  'Deep Cleaning',
  'Move In / Move Out',
  'Recurring Plan',
];

function validate(body) {
  const errors = {};
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const service = (body.service || '').trim();
  const message = (body.message || '').trim();

  if (!name || name.length < 2) errors.name = 'Name is required.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'A valid email is required.';
  if (phone && phone.replace(/\D/g, '').length < 7) errors.phone = 'Phone number looks incomplete.';
  if (service && !VALID_SERVICES.includes(service)) errors.service = 'Unrecognized service selected.';
  if (message.length > 2000) errors.message = 'Message is too long (max 2000 characters).';

  return {
    errors,
    valid: Object.keys(errors).length === 0,
    data: { name, email, phone, service: service || 'Not specified', message },
  };
}

async function submitQuoteRequest(req, res) {
  const { valid, errors, data } = validate(req.body || {});

  if (!valid) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    const record = await submissionStore.save(data);
    const mailResult = await sendQuoteNotification(data);

    return res.status(201).json({
      ok: true,
      id: record.id,
      emailSent: mailResult.sent,
    });
  } catch (err) {
    console.error('[contact] failed to process submission:', err);
    if (err.code === 'STORAGE_CONFIG') {
      return res.status(503).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again shortly.' });
  }
}

async function listSubmissions(req, res) {
  try {
    const all = await submissionStore.readAll();
    return res.json({ ok: true, count: all.length, submissions: all });
  } catch (err) {
    console.error('[contact] failed to list submissions:', err);
    const status = err.code === 'STORAGE_CONFIG' ? 503 : 500;
    return res.status(status).json({ ok: false, error: err.message || 'Unable to load submissions.' });
  }
}

module.exports = { submitQuoteRequest, listSubmissions };
