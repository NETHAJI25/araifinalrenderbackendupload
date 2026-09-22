const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('firebase-admin');
const { generateSubmissionId } = require('../utils/idGenerator');

// Get Firebase Realtime Database reference
const db = firebaseAdmin.database();
const submissionsRef = db.ref('submissions');
const teamsRef = db.ref('teams');

/**
 * Submit project
 */
exports.submitProject = async (req, res) => {
  try {
    const { teamId, projectName, description, presentationUrl, codeUrl, demoVideoUrl } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!teamId || !projectName) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and project name are required'
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

    // Get team
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
        message: 'Only team leader can submit the project'
      });
    }

    // Check if team is confirmed
    if (team.confirmationStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Team must be confirmed before submitting project'
      });
    }

    // Check if team has paid
    const allPaid = team.members.every(member => member.paymentStatus === 'paid');
    if (!allPaid) {
      return res.status(400).json({
        success: false,
        message: 'All team members must complete payment before submitting project'
      });
    }

    // Check if team already has a submission
    const submissionsSnapshot = await submissionsRef.orderByChild('teamId').equalTo(teamId).once('value');
    if (submissionsSnapshot.exists()) {
      return res.status(400).json({
        success: false,
        message: 'This team has already submitted a project.'
      });
    }

    // Create new submission
    const submissionId = uuidv4();
    const generatedSubmissionId = generateSubmissionId();
    const newSubmission = {
      id: submissionId,
      submissionId: generatedSubmissionId,
      teamId: team.id,
      projectName,
      description: description || '',
      presentationUrl: presentationUrl || null,
      codeUrl: codeUrl || null,
      demoVideoUrl: demoVideoUrl || null,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };

    // Save submission to database
    await submissionsRef.child(submissionId).set(newSubmission);

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      data: newSubmission
    });
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during project submission'
    });
  }
};

/**
 * Get submission by team ID
 */
exports.getMySubmission = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    const submissionsSnapshot = await submissionsRef.orderByChild('teamId').equalTo(teamId).once('value');
    const submissions = submissionsSnapshot.exists() ? submissionsSnapshot.val() : {};

    // Get the submission
    let submission = null;
    let submissionId = null;

    Object.keys(submissions).forEach(key => {
      submission = submissions[key];
      submissionId = key;
    });

    res.status(200).json({
      success: true,
      data: submission ? { ...submission, id: submissionId } : null
    });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update submission
 */
exports.updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID is required'
      });
    }

    // Get submission
    const submissionRef = submissionsRef.child(submissionId);
    const snapshot = await submissionRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submission = snapshot.val();

    // Get team to verify user is team leader
    const teamSnapshot = await teamsRef.child(submission.teamId).once('value');
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
        message: 'Only team leader can update the submission'
      });
    }

    // Update submission
    const updatedSubmission = {
      ...submission,
      ...updates
    };

    // Save updated submission
    await submissionRef.set(updatedSubmission);

    res.status(200).json({
      success: true,
      message: 'Submission updated successfully',
      data: {
        ...updatedSubmission,
        id: submissionId
      }
    });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during submission update'
    });
  }
};

/**
 * Get all submissions (admin only)
 */
exports.getAll = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const submissionsSnapshot = await submissionsRef.once('value');
    const submissions = submissionsSnapshot.exists() ? submissionsSnapshot.val() : {};

    // Convert object to array and sort by submittedAt descending
    const submissionsArray = Object.keys(submissions).map(key => ({
      ...submissions[key],
      id: key
    })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.status(200).json({
      success: true,
      data: submissionsArray
    });
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};