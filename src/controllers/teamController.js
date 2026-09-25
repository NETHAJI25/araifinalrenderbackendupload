const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
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
  const { data: teamRow, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('team_id', code)
    .maybeSingle();
  if (teamError) throw new Error(teamError.message);
  if (!teamRow) return null;
  const { data: memberRows, error: membersError } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', code)
    .order('joined_at');
  if (membersError) throw new Error(membersError.message);
  return formatTeam(teamRow, memberRows || []);
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in a team
    if (user.team_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team'
      });
    }
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (memberCheckError) throw new Error(memberCheckError.message);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team'
      });
    }

    // Create new team
    const id = uuidv4();
    const generatedTeamId = generateTeamId();
    const now = new Date().toISOString();

    const { error: insertTeamError } = await supabase
      .from('teams')
      .insert({
        id,
        team_id: generatedTeamId,
        team_name: teamName,
        leader_id: userId,
        problem_statement_id: problemStatementId || null,
        problem_statement_title: problemStatementTitle || null,
        status: 'active',
        confirmation_status: 'pending',
        round: 1,
        created_at: now,
        updated_at: now
      });
    if (insertTeamError) throw new Error(insertTeamError.message);

    const { error: insertMemberError } = await supabase
      .from('team_members')
      .insert({
        team_id: generatedTeamId,
        user_id: user.id,
        name: user.name,
        college: user.college,
        role: 'Team Leader',
        payment_status: user.payment_status,
        profile_completed: user.profile_completed,
        joined_at: new Date().toISOString()
      });
    if (insertMemberError) throw new Error(insertMemberError.message);

    // Update user's team_id
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ team_id: generatedTeamId })
      .eq('id', userId);
    if (updateUserError) throw new Error(updateUserError.message);

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.teamId,
        user_id: user.id,
        name: user.name,
        college: user.college,
        role: 'Member',
        payment_status: user.payment_status,
        profile_completed: user.profile_completed,
        joined_at: new Date().toISOString()
      });
    if (insertError) throw new Error(insertError.message);

    // Update user's team_id
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ team_id: team.teamId })
      .eq('id', userId);
    if (updateUserError) throw new Error(updateUserError.message);

    // Update teams.updated_at
    const { error: touchError } = await supabase
      .from('teams')
      .update({ updated_at: new Date().toISOString() })
      .eq('team_id', team.teamId);
    if (touchError) throw new Error(touchError.message);

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    const { error: updateError } = await supabase
      .from('teams')
      .update({ confirmation_status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (updateError) throw new Error(updateError.message);

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
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        problem_statement_id: psId !== undefined ? psId : null,
        problem_statement_title: psTitle !== undefined ? psTitle : null,
        updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId);
    if (updateError) throw new Error(updateError.message);

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
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    if (deleteError) throw new Error(deleteError.message);

    // Update user's team_id
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ team_id: null })
      .eq('id', userId);
    if (updateUserError) throw new Error(updateUserError.message);

    // Update teams.updated_at
    const { error: touchError } = await supabase
      .from('teams')
      .update({ updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (touchError) throw new Error(touchError.message);

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
    const { error: updateError } = await supabase
      .from('teams')
      .update({ status: 'complete', updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (updateError) throw new Error(updateError.message);

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

    const { data: teamRows, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    if (teamsError) throw new Error(teamsError.message);

    const { data: memberRows, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .order('joined_at');
    if (membersError) throw new Error(membersError.message);

    const membersByTeam = {};
    for (const m of (memberRows || [])) {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push(m);
    }

    const teamsArray = (teamRows || []).map((teamRow) =>
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
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        status: 'rejected',
        rejection_reason: reason !== undefined ? reason : null,
        updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId);
    if (updateError) throw new Error(updateError.message);

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
    const { error: updateError } = await supabase
      .from('teams')
      .update({ round, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (updateError) throw new Error(updateError.message);

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
