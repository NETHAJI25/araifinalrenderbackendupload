const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function authorizeAdmin(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
}

function authorizeTeamLeader(req, res, next) {
  try {
    if (req.user.role !== 'team_leader') {
      return res.status(403).json({ success: false, message: 'Team leader access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
}

module.exports = { authenticate, authorizeAdmin, authorizeTeamLeader };