const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { generateTeamId } = require('../utils/idGenerator');
const eventConfig = require('../config/eventConfig');

function toISOStringSafe(value) {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function formatTeam(teamRow, memberRows) {
  const team = {
    id: teamRow.id,
    teamId: teamRow.team_id,
    teamName: teamRow.team_name,
    leaderId: teamRow.leader_id,
    problemStatementId: teamRow.problem_statement_id,
    problemStatementTitle: teamRow.problem_statement_title,
    members: memberRows.map((m) => ({
      userId: m.user_id,
      name: m.name,
      college: m.college,
      role: m.role,
      paymentStatus: m.payment_status,
      profileCompleted: m.profile_completed,
      joinedAt: toISOStringSafe(m.joined_at)
    })),
    status: teamRow.status,
    confirmationStatus: teamRow.confirmation_status,
    round: teamRow.round,
    createdAt: toISOStringSafe(teamRow.created_at),
    updatedAt: toISOStringSafe(teamRow.updated_at)
  };
  if (teamRow.rejection_reason !== null && teamRow.rejection_reason !== undefined) {
    team.rejectionReason = teamRow.rejection_reason;
  }
  return team;
}

async function fetchTeamByCode(code) {
  const teamRes = await query('SELECT * FROM teams WHERE team_id = $1', [code]);
  if (teamRes.rows.length === 0) return null;
  const teamRow = teamRes.rows[0];
  const membersRes = await query('SELECT * FROM team_members WHERE team_id = $1 ORDER BY joined_at', [code]);
  return formatTeam(teamRow, membersRes.rows);
}

/**
 * Create a new team
 */
exports.createTeam = async (req, res) => {
  try {
    const { teamName, problemStatementId, problemStatementTitle } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    // Get current user
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userRes.rows[0];

    // Check if user is already in a team
    if (user.team_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team'
      });
    }
    const memberRes = await query('SELECT 1 FROM team_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (memberRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team'
      });
    }

    // Create new team
    const id = uuidv4();
    const generatedTeamId = generateTeamId();

    await query(
      `INSERT INTO teams (id, team_id, team_name, leader_id, problem_statement_id, problem_statement_title, status, confirmation_status, round, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', 'pending', 1, NOW(), NOW())`,
      [id, generatedTeamId, teamName, userId, problemStatementId || null, problemStatementTitle || null]
    );

    await query(
      `INSERT INTO team_members (team_id, user_id, name, college, role, payment_status, profile_completed, joined_at)
       VALUES ($1, $2, $3, $4, 'Team Leader', $5, $6, NOW())`,
      [generatedTeamId, user.id, user.name, user.college, user.payment_status, user.profile_completed]
    );

    // Update user's team_id
    await query('UPDATE users SET team_id = $1 WHERE id = $2', [generatedTeamId, userId]);

    const newTeam = await fetchTeamByCode(generatedTeamId);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: newTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during team creation'
    });
  }
};

/**
 * Join a team
 */
exports.joinTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    // Validate input
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    // Get current user
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userRes.rows[0];

    // Get team by CODE (team_id column)
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Team ID. Please check and try again.'
      });
    }

    // Check if team is full
    if (team.members.length >= 6) {
      return res.status(400).json({
        success: false,
        message: 'This team is already full (maximum 6 members).'
      });
    }

    // Check if user is already in this team
    const alreadyInTeam = team.members.some(member => String(member.userId) === String(userId));
    if (alreadyInTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team.'
      });
    }

    // Check if user is in another team
    if (user.team_id && user.team_id !== teamId) {
      return res.status(400).json({
        success: false,
        message: 'You are already in another team.'
      });
    }

    // Add user to team
    await query(
      `INSERT INTO team_members (team_id, user_id, name, college, role, payment_status, profile_completed, joined_at)
       VALUES ($1, $2, $3, $4, 'Member', $5, $6, NOW())`,
      [team.teamId, user.id, user.name, user.college, user.payment_status, user.profile_completed]
    );

    // Update user's team_id
    await query('UPDATE users SET team_id = $1 WHERE id = $2', [team.teamId, userId]);

    // Update teams.updated_at
    await query('UPDATE teams SET updated_at = NOW() WHERE team_id = $1', [team.teamId]);

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: 'Joined team successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during joining team'
    });
  }
};

/**
 * Get team by ID
 */
exports.getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    // Query by CODE (team_id column)
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get current user's team
 */
exports.getMyTeam = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userRes.rows[0];

    if (!user.team_id) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Query team by CODE via users.team_id
    const team = await fetchTeamByCode(user.team_id);
    if (!team) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Confirm team (leader only)
 */
exports.confirmTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    // Get team by CODE
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (String(team.leaderId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can confirm the team'
      });
    }

    // Check if team has minimum members
    if (team.members.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Team must have at least 4 members to confirm.'
      });
    }

    // Update team confirmation status
    await query("UPDATE teams SET confirmation_status = 'confirmed', updated_at = NOW() WHERE team_id = $1", [teamId]);

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: 'Team confirmed successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Confirm team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during team confirmation'
    });
  }
};

/**
 * Update team problem statement
 */
exports.updateTeamProblemStatement = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { psId, psTitle } = req.body;
    const userId = req.user.userId;

    // Get team by CODE
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (String(team.leaderId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update problem statement'
      });
    }

    // Update team
    await query(
      'UPDATE teams SET problem_statement_id = $1, problem_statement_title = $2, updated_at = NOW() WHERE team_id = $3',
      [psId !== undefined ? psId : null, psTitle !== undefined ? psTitle : null, teamId]
    );

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: 'Problem statement updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update problem statement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Leave team
 */
exports.leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    // Get team by CODE
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (String(team.leaderId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave the team.'
      });
    }

    // Remove user from team
    await query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);

    // Update user's team_id
    await query('UPDATE users SET team_id = NULL WHERE id = $1', [userId]);

    // Update teams.updated_at
    await query('UPDATE teams SET updated_at = NOW() WHERE team_id = $1', [teamId]);

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: 'Left team successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during leaving team'
    });
  }
};

/**
 * Mark team as complete
 */
exports.markTeamComplete = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    // Get team by CODE
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (String(team.leaderId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can mark team as complete'
      });
    }

    // Check team size
    if (team.members.length < 4 || team.members.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Team must have between 4 and 6 members to be completed.'
      });
    }

    // Update team status
    await query("UPDATE teams SET status = 'complete', updated_at = NOW() WHERE team_id = $1", [teamId]);

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: 'Team marked as complete successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Mark team complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during marking team complete'
    });
  }
};

/**
 * Get all teams (admin only)
 */
exports.getAllTeams = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const teamsRes = await query('SELECT * FROM teams ORDER BY created_at DESC');
    const membersRes = await query('SELECT * FROM team_members ORDER BY joined_at');

    const membersByTeam = {};
    for (const m of membersRes.rows) {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push(m);
    }

    const teamsArray = teamsRes.rows.map((teamRow) =>
      formatTeam(teamRow, membersByTeam[teamRow.team_id] || [])
    );

    res.status(200).json({
      success: true,
      data: teamsArray
    });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Reject team (admin only)
 */
exports.rejectTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Get team by CODE
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Update team status
    await query('UPDATE teams SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE team_id = $3', [
      'rejected',
      reason !== undefined ? reason : null,
      teamId
    ]);

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: 'Team rejected successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Reject team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during team rejection'
    });
  }
};

/**
 * Update team round (admin only)
 */
exports.updateTeamRound = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { round } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Validate round
    if (![1, 2].includes(round)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid round. Must be 1 or 2.'
      });
    }

    // Get team by CODE
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Update team round
    await query('UPDATE teams SET round = $1, updated_at = NOW() WHERE team_id = $2', [round, teamId]);

    const updatedTeam = await fetchTeamByCode(teamId);

    res.status(200).json({
      success: true,
      message: `Team promoted to Round ${round} successfully`,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team round error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during team round update'
    });
  }
};
