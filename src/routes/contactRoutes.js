const express = require('express');
const router = express.Router();
const firebaseAdmin = require('firebase-admin');
const { sendContactNotification, verifyMailConfig } = require('../utils/mailer');

// GET /api/contact/mail-status - check SMTP config (no secrets exposed)
router.get('/mail-status', async (req, res) => {
  try {
    const result = await verifyMailConfig();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(200).json({ success: true, data: { configured: false, error: error.message } });
  }
});

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, subject, message'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Store in Firebase RTDB under /contacts
    const db = firebaseAdmin.database();
    const contactsRef = db.ref('contacts');
    
    const newContact = {
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    await contactsRef.push(newContact);

    // Send email notification to admin (non-blocking — form succeeds even if mail fails)
    let emailSent = false;
    try {
      emailSent = await sendContactNotification({ name, email, subject, message });
    } catch (mailErr) {
      console.error('[MAIL] Failed to send contact notification:', mailErr.message);
    }

    console.log('New contact form submission:', { name, email, subject, emailSent });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

module.exports = router;