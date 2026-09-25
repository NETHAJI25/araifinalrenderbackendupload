const nodemailer = require('nodemailer');

// Render's egress has no IPv6 route to Gmail — force IPv4 DNS first
try {
  require('dns').setDefaultResultOrder('ipv4first');
} catch {}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }
  const useTls587 = process.env.SMTP_PORT === '587';
  transporter = nodemailer.createTransport(
    useTls587
      ? {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
          connectionTimeout: 10000, // fail fast instead of hanging
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
      : {
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
          connectionTimeout: 10000, // fail fast instead of hanging
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
  );
  return transporter;
}

/**
 * Send via Resend HTTP API (works over port 443 — never blocked).
 * Returns true on success, throws on failure.
 */
async function sendViaResend({ name, email, subject, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null; // not configured
  const from = process.env.MAIL_FROM || 'Innovators Arena <onboarding@resend.dev>';
  const to = process.env.ADMIN_EMAIL || 'Contact11induskiller@gmail.com';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `[Website Contact] ${subject}`,
      html: `
        <h2>New Website Contact Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Reply directly to ${escapeHtml(email)}</p>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
  }
  console.log('[MAIL] Contact notification sent via Resend to', to);
  return true;
}

/**
 * Send via FormSubmit (HTTPS, no signup/key needed).
 * First-ever submission triggers a one-click activation email to the inbox owner.
 */
async function sendViaFormSubmit({ name, email, subject, message }) {
  const to = process.env.ADMIN_EMAIL || 'Contact11induskiller@gmail.com';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        email,
        subject,
        message,
        _subject: `[Website Contact] ${subject}`,
        _template: 'table',
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`FormSubmit ${res.status}: ${text.slice(0, 200)}`);
    }
    console.log('[MAIL] Contact notification sent via FormSubmit to', to);
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send contact-form notification email to admin.
 * Order: Resend (if key) → FormSubmit (no key needed) → Gmail SMTP (blocked on Render, last resort).
 * Non-blocking: resolves false (not throw) if all providers fail.
 */
async function sendContactNotification({ name, email, subject, message }) {
  // Preferred: Resend HTTP API
  try {
    const sent = await sendViaResend({ name, email, subject, message });
    if (sent) return true;
  } catch (err) {
    console.error('[MAIL] Resend failed:', err.message);
  }

  // Fallback: FormSubmit (no signup needed, one-click activation on first mail)
  try {
    const sent = await sendViaFormSubmit({ name, email, subject, message });
    if (sent) return true;
  } catch (err) {
    console.error('[MAIL] FormSubmit failed:', err.message);
  }

  const mailer = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || 'Contact11induskiller@gmail.com';
  if (!mailer) {
    console.warn('[MAIL] No mail provider configured. Skipping email.');
    return false;
  }

  const mailOptions = {
    from: `"Innovators Arena Website" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    replyTo: email,
    subject: `[Website Contact] ${subject}`,
    text: `New message from Innovators Arena 2.0 website contact form.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nReply directly to ${email}`,
    html: `
      <h2>New Website Contact Message</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Reply directly to ${escapeHtml(email)}</p>
    `,
  };

  await mailer.sendMail(mailOptions);
  console.log('[MAIL] Contact notification sent to', adminEmail);
  return true;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Verify SMTP connectivity without exposing secrets.
 */
async function verifyMailConfig() {
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const smtpConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  if (!resendConfigured && !smtpConfigured) {
    return { configured: false, reason: 'No mail provider configured (RESEND_API_KEY or GMAIL_* missing)' };
  }
  if (resendConfigured) {
    return { configured: true, provider: 'resend', smtp: 'not-used' };
  }
  // FormSubmit needs no key — always available as fallback (SMTP kept for reference)
  let smtp = 'not-configured';
  if (smtpConfigured) {
    const mailer = getTransporter();
    try {
      await mailer.verify();
      smtp = 'verified';
    } catch (err) {
      smtp = 'failed';
    }
  }
  return { configured: true, provider: 'formsubmit', smtp };
}

module.exports = { sendContactNotification, verifyMailConfig };
