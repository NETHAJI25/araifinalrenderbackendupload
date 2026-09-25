const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

/**
 * Send contact-form notification email to admin.
 * Non-blocking: resolves false (not throw) if mail is not configured or fails.
 */
async function sendContactNotification({ name, email, subject, message }) {
  const mailer = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || 'Contact11induskiller@gmail.com';
  if (!mailer) {
    console.warn('[MAIL] Gmail not configured (GMAIL_USER/GMAIL_APP_PASSWORD missing). Skipping email.');
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

module.exports = { sendContactNotification };
