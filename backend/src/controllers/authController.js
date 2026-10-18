const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// Map a `users` table row (snake_case) to the camelCase shape the frontend expects.
// Keeping this in one place avoids the previous bug where login/register returned
// only a partial, snake_case user and the UI lost city/state/course/teamId.
function formatUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    college: user.college,
    course: user.course,
    year: user.year,
    city: user.city,
    state: user.state,
    country: user.country,
    linkedin: user.linkedin,
    github: user.github,
    // Self-heal: the stored flag can be stale (e.g. older rows saved before all
    // fields were persisted). Treat a row as complete when its fields are filled.
    profileCompleted: user.profile_completed === true || isProfileComplete(user),
    paymentStatus: user.payment_status,
    teamId: user.team_id,
    role: user.role,
    createdAt: user.created_at,
  };
}

// Must match `profileCompletionPercent` on the frontend (name, phone, college,
// course, year, city, state).
const REQUIRED_PROFILE_FIELDS = ['name', 'phone', 'college', 'course', 'year', 'city', 'state'];
function isProfileComplete(row) {
  return REQUIRED_PROFILE_FIELDS.every((field) => row[field] && String(row[field]).trim().length > 0);
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(userId, role) {
  const payload = { userId, role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory OTP store: key -> { otp, expiresAt }.
// Used for password resets because the users table has no otp columns
// and no SMS/email gateway is configured (OTP is shown on screen).
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000;

function otpKey({ phone, email }) {
  return phone ? `phone:${String(phone).trim()}` : `email:${String(email).trim().toLowerCase()}`;
}

function saveOtp(key, otp) {
  otpStore.set(key, { otp, expiresAt: Date.now() + OTP_TTL_MS });
}

function readOtp(key) {
  const entry = otpStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(key);
    return null;
  }
  return entry;
}

exports.register = async (req, res) => {
  try {
    const {
      name, email, phone, college, password, acceptTerms,
      course, year, city, state, country, linkedin, github,
    } = req.body;

    if (!name || !email || !phone || !college || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (!acceptTerms) {
      return res.status(400).json({ success: false, message: 'Terms and conditions must be accepted' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) throw new Error(userError.message);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = uuidv4();
    const now = new Date().toISOString();

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name,
        email,
        phone,
        college,
        course: course || null,
        year: year || null,
        city: city || null,
        state: state || null,
        country: country || 'India',
        linkedin: linkedin || null,
        github: github || null,
        password: hashedPassword,
        role: 'team_leader',
        payment_status: 'pending',
        profile_completed: isProfileComplete({ name, phone, college, course, year, city, state })
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    const token = generateToken(userId, 'team_leader');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: formatUser(insertedUser),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error) throw new Error(error.message);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: formatUser(user)
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name, phone, college, course, year, city, state, country,
      linkedin, github,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (college !== undefined) updateData.college = college;
    if (course !== undefined) updateData.course = course;
    if (year !== undefined) updateData.year = year;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Derive completion from the merged row so the stored flag can never drift.
    const { data: current, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    updateData.profile_completed = isProfileComplete({ ...current, ...updateData });

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: formatUser(updated)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Mobile number or email is required' });
    }

    const column = phone ? 'phone' : 'email';
    const value = phone ? String(phone).trim() : email;

    const { data: matches, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq(column, value)
      .order('created_at', { ascending: false })
      .limit(10);

    if (userError) throw new Error(userError.message);
    if (!matches || matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: phone ? 'No account found with this mobile number' : 'No account found with this email'
      });
    }
    if (matches.length > 1) {
      return res.status(409).json({
        success: false,
        message: phone
          ? 'Multiple accounts use this mobile number. Please use your email address instead to reset your password.'
          : 'Multiple accounts use this email. Please contact support.'
      });
    }
    const existingUser = matches[0];

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOtp(otpKey({ phone, email }), otp);

    // Email delivery is only attempted when an email address and a mail key are available.
    if (email && process.env.RESEND_API_KEY) {
      const { data: settings, error: settingError } = await supabase
        .from('system_settings')
        .select('*')
        .maybeSingle();

      if (!settingError && settings && settings.otp_enabled !== false) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 587,
          secure: false,
          auth: { user: 'resend', pass: process.env.RESEND_API_KEY }
        });

        await transporter.sendMail({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your OTP Code for Innovators Arena 2.0',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">Your OTP Code</h2>
              <p>Your OTP code is: <strong style="font-size: 24px; color: #7c3aed;">${otp}</strong></p>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP generated successfully',
      // No SMS/email gateway is configured, so the OTP is returned for on-screen display.
      otp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, phone, otp, newPassword } = req.body;

    if ((!email && !phone) || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mobile number, OTP, and new password are required' });
    }

    const column = phone ? 'phone' : 'email';
    const value = phone ? String(phone).trim() : email;

    const { data: matches, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq(column, value)
      .order('created_at', { ascending: false })
      .limit(10);

    if (userError) throw new Error(userError.message);
    if (!matches || matches.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (matches.length > 1) {
      return res.status(409).json({
        success: false,
        message: phone
          ? 'Multiple accounts use this mobile number. Please use your email address instead to reset your password.'
          : 'Multiple accounts use this email. Please contact support.'
      });
    }
    const user = matches[0];

    const key = otpKey({ phone, email });
    const entry = readOtp(key);
    if (!entry || entry.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    otpStore.delete(key);

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, college, course, year, city, state, country, linkedin, github, role, payment_status, profile_completed, team_id, created_at');

    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, data: users.map(formatUser) });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};