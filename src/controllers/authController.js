const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { createClient } = require('@supabase/supabase-js');
const eventConfig = require('../config/eventConfig');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

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
 * Map a DB row (snake_case) to a camelCase API object (never includes password)
 * @param {Object} row - Supabase row from users table
 * @returns {Object} API user object
 */
const mapUserRow = (row) => {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    college: row.college,
    course: row.course,
    year: row.year,
    city: row.city,
    state: row.state,
    country: row.country,
    linkedin: row.linkedin,
    github: row.github,
    profileCompleted: row.profile_completed,
    paymentStatus: row.payment_status,
    teamId: row.team_id,
    role: row.role,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
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
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (existingError) {
      throw new Error(existingError.message);
    }
    if (existing) {
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
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
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
        linkedin: linkedin || null,
        github: github || null,
        profile_completed: false,
        payment_status: 'pending',
        team_id: null,
        role
      })
      .select()
      .single();
    if (insertError) {
      throw new Error(insertError.message);
    }

    const userWithoutPassword = mapUserRow(inserted);

    // Generate token
    const token = generateToken({ id: userId, email: email.toLowerCase(), role });

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
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (findError) {
      throw new Error(findError.message);
    }
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Remove password from user object
    const userWithoutPassword = mapUserRow(user);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

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

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (findError) {
      throw new Error(findError.message);
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userWithoutPassword = mapUserRow(user);

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
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { data: rows, error: listError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (listError) {
      throw new Error(listError.message);
    }

    // Strip passwords (mapUserRow never includes password)
    const usersArray = rows.map((row) => mapUserRow(row));

    res.status(200).json({
      success: true,
      data: usersArray
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = { ...req.body };

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.role;

    // Map camelCase API fields to snake_case DB columns
    const fieldMap = {
      name: 'name',
      phone: 'phone',
      college: 'college',
      course: 'course',
      year: 'year',
      city: 'city',
      state: 'state',
      country: 'country',
      linkedin: 'linkedin',
      github: 'github',
      profileCompleted: 'profile_completed',
      paymentStatus: 'payment_status',
      teamId: 'team_id',
      profile_completed: 'profile_completed',
      payment_status: 'payment_status',
      team_id: 'team_id'
    };

    const updatePayload = {};
    for (const [key, value] of Object.entries(updates)) {
      const column = fieldMap[key];
      if (column) {
        updatePayload[column] = value;
      }
    }

    let updatedRow;
    if (Object.keys(updatePayload).length > 0) {
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .maybeSingle();
      if (updateError) {
        throw new Error(updateError.message);
      }
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      updatedRow = data;
    } else {
      // No updatable fields provided — just fetch current user
      const { data, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (findError) {
        throw new Error(findError.message);
      }
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      updatedRow = data;
    }

    const userWithoutPassword = mapUserRow(updatedRow);

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
