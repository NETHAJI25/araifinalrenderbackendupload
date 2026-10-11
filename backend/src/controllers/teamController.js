const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const cashfreeService = require('../services/cashfreeService');

const generateTeamId = () => `IA26-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const toISOStringSafe = (value) => {
  if (value instanceof Date) return value.toISOString();
  return value;
};

const formatTeam = (teamRow, memberRows) => {
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
};

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

exports.createTeam = async (req, res) => {
  try {
    const { teamName, problemStatementId, problemStatementTitle } = req.body;
    const userId = req.user.userId;

    if (!teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

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

    const teamId = generateTeamId();
    const newTeam = {
      id: uuidv4(),
      team_id: teamId,
      team_name: teamName,
      leader_id: userId,
      problem_statement_id: problemStatementId || null,
      problem_statement_title: problemStatementTitle || null,
      status: 'active',
      confirmation_status: 'pending',
      round: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: teamInsertError } = await supabase.from('teams').insert(newTeam);
    if (teamInsertError) throw new Error(teamInsertError.message);

    const member = {
      user_id: userId,
      team_id: teamId,
      name: user.name,
      college: user.college,
      role: 'Team Leader',
      payment_status: user.payment_status,
      profile_completed: user.profile_completed,
      joined_at: new Date().toISOString()
    };
    const { error: memberInsertError } = await supabase.from('team_members').insert(member);
    if (memberInsertError) throw new Error(memberInsertError.message);

    await supabase.from('users').update({ team_id: teamId }).eq('id', userId);

    const createdTeam = await fetchTeamByCode(teamId);
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: createdTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during team creation'
    });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

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

    if (user.team_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team'
      });
    }

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Team ID. Please check and try again.'
      });
    }
    if (team.members.length >= 6) {
      return res.status(400).json({
        success: false,
        message: 'This team is already full (maximum 6 members).'
      });
    }
    if (team.members.some((m) => m.userId === userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team.'
      });
    }

    const alreadyInOtherTeam = await supabase
      .from('team_members')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (alreadyInOtherTeam.data) {
      return res.status(400).json({
        success: false,
        message: 'You are already in another team.'
      });
    }

    const member = {
      user_id: userId,
      team_id: teamId,
      name: user.name,
      college: user.college,
      role: 'Member',
      payment_status: user.payment_status,
      profile_completed: user.profile_completed,
      joined_at: new Date().toISOString()
    };
    const { error: memberInsertError } = await supabase.from('team_members').insert(member);
    if (memberInsertError) throw new Error(memberInsertError.message);

    await supabase.from('teams').update({ updated_at: new Date().toISOString() }).eq('team_id', teamId);
    await supabase.from('users').update({ team_id: teamId }).eq('id', userId);

    const updatedTeam = await fetchTeamByCode(teamId);
    res.status(200).json({
      success: true,
      message: 'Successfully joined team',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during joining team'
    });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyTeam = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user || !user.team_id) {
      return res.status(200).json({ success: true, data: null });
    }
    const team = await fetchTeamByCode(user.team_id);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', team.team_id)
          .order('joined_at');
        return formatTeam(team, members || []);
      })
    );

    res.status(200).json({ success: true, data: teamsWithMembers });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.confirmTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.leaderId !== userId) {
      return res.status(403).json({ success: false, message: 'Only team leader can confirm team' });
    }
    if (team.confirmationStatus === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Team already confirmed' });
    }

    const allPaid = team.members.every(m => m.paymentStatus === 'paid' || m.paymentStatus === 'verified');
    if (!allPaid) {
      return res.status(400).json({ success: false, message: 'All members must complete payment before confirmation' });
    }

    const { error } = await supabase
      .from('teams')
      .update({ confirmation_status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);

    const updatedTeam = await fetchTeamByCode(teamId);
    res.status(200).json({ success: true, message: 'Team confirmed successfully', data: updatedTeam });
  } catch (error) {
    console.error('Confirm team error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTeamProblemStatement = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { problemStatementId, problemStatementTitle } = req.body;
    const userId = req.user.userId;

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.leaderId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only team leader can update problem statement' });
    }

    const { error } = await supabase
      .from('teams')
      .update({ problem_statement_id: problemStatementId, problem_statement_title: problemStatementTitle, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);

    const updatedTeam = await fetchTeamByCode(teamId);
    res.status(200).json({ success: true, message: 'Problem statement updated', data: updatedTeam });
  } catch (error) {
    console.error('Update problem statement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (team.leaderId === userId) {
      return res.status(400).json({ success: false, message: 'Team leader cannot leave. Transfer leadership or delete team.' });
    }

    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    if (error) throw new Error(error.message);

    await supabase.from('users').update({ team_id: null }).eq('id', userId);

    const updatedTeam = await fetchTeamByCode(teamId);
    res.status(200).json({ success: true, message: 'Left team successfully', data: updatedTeam });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markTeamComplete = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (String(team.leaderId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Only team leader can mark team as complete' });
    }
    if (team.members.length < 2 || team.members.length > 6) {
      return res.status(400).json({ success: false, message: 'Team must have between 2 and 6 members to be completed.' });
    }

    const { error } = await supabase
      .from('teams')
      .update({ status: 'complete', round: 1, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);

    const updatedTeam = await fetchTeamByCode(teamId);
    res.status(200).json({ success: true, message: 'Team marked as complete successfully', data: updatedTeam });
  } catch (error) {
    console.error('Mark team complete error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.rejectTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { reason } = req.body;

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const { error } = await supabase
      .from('teams')
      .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, message: 'Team rejected successfully' });
  } catch (error) {
    console.error('Reject team error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTeamRound = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { round } = req.body;

    if (![1, 2].includes(round)) {
      return res.status(400).json({ success: false, message: 'Invalid round. Must be 1 or 2.' });
    }

    const team = await fetchTeamByCode(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const { error } = await supabase
      .from('teams')
      .update({ round, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);

    const updatedTeam = await fetchTeamByCode(teamId);
    res.status(200).json({ success: true, message: 'Team round updated', data: updatedTeam });
  } catch (error) {
    console.error('Update team round error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};