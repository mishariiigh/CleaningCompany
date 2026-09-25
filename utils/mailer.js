const nodemailer = require('nodemailer');

let transporter = null;

function isPlaceholderConfig(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'example.com' || normalized === 'your-smtp-username' || normalized === 'your-smtp-password' || normalized.includes('example') || normalized.includes('your-');
}

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || isPlaceholderConfig(SMTP_HOST) || isPlaceholderConfig(SMTP_USER) || isPlaceholderConfig(SMTP_PASS)) {
    console.warn('[mailer] SMTP env vars are not configured — emails will be logged instead of sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

async function sendQuoteNotification(submission) {
  const t = getTransporter();
  const subject = `New quote request from ${submission.name}`;
  const appUrl = process.env.APP_URL || 'http://localhost:4000';
  const adminUrl = `${appUrl.replace(/\/$/, '')}/admin`;
  const body = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || 'n/a'}`,
    `Service: ${submission.service}`,
    `Message: ${submission.message || 'n/a'}`,
    '',
    `Admin panel: ${adminUrl}`,
  ].join('\n');

  if (!t) {
    console.log('[mailer] (dry run) would send email to mishariiigh@hotmail.com:\n' + body);
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    await t.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'mishariiigh@hotmail.com',
      to: process.env.NOTIFY_EMAIL || 'mishariiigh@hotmail.com',
      replyTo: submission.email,
      subject,
      text: body,
    });

    return { sent: true };
  } catch (error) {
    console.error('[mailer] SMTP send failed:', error.message || error);
    console.log('[mailer] (dry run fallback) would send email to mishariiigh@hotmail.com:\n' + body);
    return { sent: false, reason: 'SMTP send failed' };
  }
}

module.exports = { sendQuoteNotification };
