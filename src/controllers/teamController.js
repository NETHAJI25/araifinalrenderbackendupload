const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('firebase-admin');
const { eventConfig } = require('../config/eventConfig');
const { generateTeamId } = require('../utils/idGenerator');

// Get Firebase Realtime Database reference
const db = firebaseAdmin.database();
const teamsRef = db.ref('teams');
const usersRef = db.ref('users');

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
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userSnapshot.val();

    // Check if user is already in a team
    const teamsSnapshot = await teamsRef.orderByChild('members').once('value');
    let userInTeam = false;
    teamsSnapshot.forEach((teamSnapshot) => {
      const team = teamSnapshot.val();
      const memberExists = team.members.some(member => member.userId === userId);
      if (memberExists) {
        userInTeam = true;
        return true;
      }
      return false;
    });

    if (userInTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team'
      });
    }

    // Create new team
    const teamId = uuidv4();
    const generatedTeamId = generateTeamId();
    const newTeam = {
      id: teamId,
      teamId: generatedTeamId,
      teamName,
      leaderId: userId,
      problemStatementId: problemStatementId || null,
      problemStatementTitle: problemStatementTitle || null,
      members: [
        {
          userId: user.id,
          name: user.name,
          college: user.college,
          role: 'Team Leader',
          paymentStatus: user.paymentStatus,
          profileCompleted: user.profileCompleted,
          joinedAt: new Date().toISOString()
        }
      ],
      status: 'active',
      confirmationStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save team to database
    await teamsRef.child(teamId).set(newTeam);

    // Update user's teamId
    await usersRef.child(userId).update({ teamId: generatedTeamId });

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
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userSnapshot.val();

    // Get team by querying teamId field (not Firebase key)
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Team ID. Please check and try again.'
      });
    }

    // Get the first (and only) matching team
    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      team.id = teamKey; // Add Firebase key for updates
      return true; // Stop after first match
    });

    // Check if team is full
    if (team.members.length >= 6) {
      return res.status(400).json({
        success: false,
        message: 'This team is already full (maximum 6 members).'
      });
    }

    // Check if user is already in this team
    const alreadyInTeam = team.members.some(member => member.userId === userId);
    if (alreadyInTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team.'
      });
    }

    // Check if user is in another team
    if (user.teamId && user.teamId !== teamId) {
      return res.status(400).json({
        success: false,
        message: 'You are already in another team.'
      });
    }

    // Add user to team
    const newMember = {
      userId: user.id,
      name: user.name,
      college: user.college,
      role: 'Member',
      paymentStatus: user.paymentStatus,
      profileCompleted: user.profileCompleted,
      joinedAt: new Date().toISOString()
    };

    const updatedMembers = [...team.members, newMember];
    const updatedTeam = {
      ...team,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    // Update user's teamId
    await usersRef.child(userId).update({ teamId: team.teamId });

    res.status(200).json({
      success: true,
      message: 'Joined team successfully',
      data: { ...updatedTeam, id: teamKey }
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

    // Query by teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      team.id = teamKey;
      return true;
    });

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
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userSnapshot.val();

    if (!user.teamId) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Query team by teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(user.teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      team.id = teamKey;
      return true;
    });

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

    // Get team by querying teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      return true;
    });

    // Check if user is team leader
    if (team.leaderId !== userId) {
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
    const updatedTeam = {
      ...team,
      confirmationStatus: 'confirmed',
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    res.status(200).json({
      success: true,
      message: 'Team confirmed successfully',
      data: { ...updatedTeam, id: teamKey }
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

    // Get team by querying teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      return true;
    });

    // Check if user is team leader
    if (team.leaderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update problem statement'
      });
    }

    // Update team
    const updatedTeam = {
      ...team,
      problemStatementId: psId,
      problemStatementTitle: psTitle,
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    res.status(200).json({
      success: true,
      message: 'Problem statement updated successfully',
      data: { ...updatedTeam, id: teamKey }
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

    // Get team by querying teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      return true;
    });

    // Check if user is team leader
    if (team.leaderId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave the team.'
      });
    }

    // Remove user from team
    const updatedMembers = team.members.filter(member => member.userId !== userId);
    const updatedTeam = {
      ...team,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    // Update user's teamId
    await usersRef.child(userId).update({ teamId: null });

    res.status(200).json({
      success: true,
      message: 'Left team successfully',
      data: { ...updatedTeam, id: teamKey }
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

    // Get team by querying teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      return true;
    });

    // Check if user is team leader
    if (team.leaderId !== userId) {
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
    const updatedTeam = {
      ...team,
      status: 'complete',
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    res.status(200).json({
      success: true,
      message: 'Team marked as complete successfully',
      data: { ...updatedTeam, id: teamKey }
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

    const teamsSnapshot = await teamsRef.once('value');
    const teams = teamsSnapshot.exists() ? teamsSnapshot.val() : {};

    // Convert object to array
    const teamsArray = Object.keys(teams).map(key => ({
      ...teams[key],
      id: key
    }));

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

    // Get team by querying teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      return true;
    });

    // Update team status
    const updatedTeam = {
      ...team,
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    res.status(200).json({
      success: true,
      message: 'Team rejected successfully',
      data: { ...updatedTeam, id: teamKey }
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

    // Get team by querying teamId field
    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (!teamsSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    let team = null;
    let teamKey = null;
    teamsSnapshot.forEach((childSnapshot) => {
      teamKey = childSnapshot.key;
      team = childSnapshot.val();
      return true;
    });

    // Update team round
    const updatedTeam = {
      ...team,
      round: round,
      updatedAt: new Date().toISOString()
    };

    // Save updated team using Firebase key
    await teamsRef.child(teamKey).set(updatedTeam);

    res.status(200).json({
      success: true,
      message: `Team promoted to Round ${round} successfully`,
      data: { ...updatedTeam, id: teamKey }
    });
  } catch (error) {
    console.error('Update team round error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during team round update'
    });
  }
};