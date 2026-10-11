const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(userId) {
  const payload = { userId };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

exports.register = async (req, res) => {
  try {
    const { name, email, phone, college, password, acceptTerms } = req.body;

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
        password: hashedPassword,
        role: 'team_leader',
        payment_status: 'unpaid',
        profile_completed: false,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: insertedUser.id,
          name: insertedUser.name,
          email: insertedUser.email,
          phone: insertedUser.phone,
          college: insertedUser.college,
          payment_status: insertedUser.payment_status,
          profile_completed: insertedUser.profile_completed
        },
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

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          college: user.college,
          team_id: user.team_id,
          payment_status: user.payment_status,
          profile_completed: user.profile_completed
        },
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
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        college: user.college,
        team_id: user.team_id,
        payment_status: user.payment_status,
        profile_completed: user.profile_completed
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, college, profileCompleted } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (college) updateData.college = college;
    if (profileCompleted !== undefined) updateData.profile_completed = profileCompleted;

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
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        college: updated.college,
        payment_status: updated.payment_status,
        profile_completed: updated.profile_completed
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) throw new Error(userError.message);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();

    await supabase
      .from('users')
      .update({ otp, otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
      .eq('email', email);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@innovatorsarena.com';
    const { data: settings, error: settingError } = await supabase
      .from('system_settings')
      .select('*')
      .maybeSingle();

    if (!settingError && settings && settings.otp_enabled !== false) {
      const nodemailer = require('nodemailer');
      let transporter = nodemailer.createTransport({
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

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password: hashedPassword, otp: null, otp_expires_at: null })
      .eq('email', email);

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
      .select('id, name, email, phone, college, payment_status, profile_completed, team_id, created_at');

    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};