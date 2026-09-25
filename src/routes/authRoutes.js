const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/send-otp', authController.sendOTP);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/update', authenticate, authController.updateProfile);
router.get('/users', authenticate, authController.getAllUsers); // Admin only

module.exports = router;