const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const firebaseAdmin = require('firebase-admin');
const { eventConfig } = require('../config/eventConfig');

// Get Firebase Realtime Database reference
const db = firebaseAdmin.database();
const authRef = db.ref('auth');
const usersRef = db.ref('users');
const teamsRef = db.ref('teams');
const announcementsRef = db.ref('announcements');
const paymentsRef = db.ref('payments');
const submissionsRef = db.ref('submissions');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
};

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, college, course, year, city, state, country, linkedin, github } = req.body;

    // Validate input
    if (!name || !email || !password || !phone || !college || !course || !year || !city || !state || !country) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Check if user already exists
    const snapshot = await usersRef.orderByChild('email').equalTo(email.toLowerCase()).once('value');
    if (snapshot.exists()) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine user role
    const role = (() => {
      const normalizedEmail = email.trim().toLowerCase();
      const isAdmin = eventConfig.adminEmails.some(
        admin => admin.trim().toLowerCase() === normalizedEmail
      );
      return isAdmin ? 'admin' : 'participant';
    })();

    // Create new user
    const userId = uuidv4();
    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      college,
      course,
      year,
      city,
      state,
      country: country || 'India',
      profileCompleted: false,
      paymentStatus: 'pending',
      teamId: null,
      role,
      linkedin: linkedin || null,
      github: github || null,
      createdAt: new Date().toISOString()
    };

    // Save user to database
    await usersRef.child(userId).set(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    // Find user by email
    const snapshot = await usersRef.orderByChild('email').equalTo(email.toLowerCase()).once('value');
    if (!snapshot.exists()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    let user = null;
    let userId = null;
    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      user = childSnapshot.val();
    });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const snapshot = await usersRef.child(userId).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = snapshot.val();
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Logout user (invalidate token client-side)
 */
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.role;

    // Update user
    await usersRef.child(userId).update(updates);

    // Get updated user
    const snapshot = await usersRef.child(userId).once('value');
    const user = snapshot.val();
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

/**
 * Send OTP (placeholder for Firebase phone auth)
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // In a real implementation, you would use Firebase Phone Auth here
    // For now, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Reset password (placeholder)
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    // In a real implementation, you would use Firebase Auth password reset here
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};