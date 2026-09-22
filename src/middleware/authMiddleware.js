const jwt = require('jsonwebtoken');
const firebaseAdmin = require('firebase-admin');

// Get Firebase Realtime Database reference
const db = firebaseAdmin.database();
const usersRef = db.ref('users');

/**
 * Authentication middleware
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token not provided or invalid format'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    // Verify user still exists in database
    const userSnapshot = await usersRef.child(decoded.userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Admin middleware
 */
exports.authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Team leader middleware
 */
exports.authorizeTeamLeader = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    // Get team
    const db = firebaseAdmin.database();
    const teamsRef = db.ref('teams');
    const teamSnapshot = await teamsRef.child(teamId).once('value');

    if (!teamSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const team = teamSnapshot.val();

    // Check if user is team leader
    if (team.leaderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Team leader privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Team leader authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization'
    });
  }
};