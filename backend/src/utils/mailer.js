const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: { user: 'resend', pass: resendApiKey }
    });
    return transporter;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass }
    });
    return transporter;
  }

  return null;
}

async function sendContactNotification({ name, email, subject, message }) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.warn('[MAIL] No email transport configured (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD missing)');
    return false;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'Contact11induskiller@gmail.com';
  const mailFrom = process.env.MAIL_FROM || 'Innovators Arena <onboarding@resend.dev>';

  const mailOptions = {
    from: mailFrom,
    to: adminEmail,
    subject: `New Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">New Contact Form Submission</h2>
        <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</div>
        </div>
        <p style="color: #666; font-size: 14px;">Submitted at: ${new Date().toISOString()}</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[MAIL] Failed to send contact notification:', error.message);
    return false;
  }
}

async function verifyMailConfig() {
  const transporter = await getTransporter();
  if (!transporter) {
    return { configured: false, reason: 'No email transport configured' };
  }
  try {
    await transporter.verify();
    return { configured: true, transport: process.env.RESEND_API_KEY ? 'Resend' : 'Gmail' };
  } catch (error) {
    return { configured: false, error: error.message };
  }
}

module.exports = { sendContactNotification, verifyMailConfig };