const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

let supabase = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  }
  return supabase;
}

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

// Leadership comes from teams.leader_id in the database — the same check the
// team controllers perform. The JWT `role` claim can be stale (users who
// registered before the app assigned 'team_leader' still carry 'participant'
// in old tokens even though they lead a team), so fall back to the DB instead
// of rejecting a legitimate leader.
async function leadsTeam(userId, teamId) {
  try {
    const db = getSupabase();
    let teamCode = teamId;
    if (!teamCode) {
      const { data: user } = await db.from('users').select('team_id').eq('id', userId).maybeSingle();
      teamCode = user && user.team_id;
    }
    if (!teamCode) return false;
    const { data: team } = await db.from('teams').select('leader_id').eq('team_id', teamCode).maybeSingle();
    return !!team && String(team.leader_id) === String(userId);
  } catch (error) {
    console.error('Team leader lookup error:', error);
    return false;
  }
}

async function authorizeTeamLeader(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'team_leader') return next();
    if (await leadsTeam(req.user.userId, req.params && req.params.teamId)) return next();
    return res.status(403).json({ success: false, message: 'Team leader access required' });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
}

function authorizeAdmin(req, res, next) {
  try {
    if (!req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
}

module.exports = { authenticate, authorizeTeamLeader, authorizeAdmin };
