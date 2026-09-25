const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { generateSubmissionId } = require('../utils/idGenerator');

function formatSubmission(row) {
  if (!row) return null;
  return {
    id: row.id,
    submissionId: row.submission_id,
    teamId: row.team_id,
    projectName: row.project_name,
    description: row.description,
    presentationUrl: row.presentation_url,
    codeUrl: row.code_url,
    demoVideoUrl: row.demo_video_url,
    status: row.status,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
  };
}

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

    // Get current user (fixed: proper SQL lookup instead of undefined usersRef)
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get team by CODE
    const teamResult = await query('SELECT * FROM teams WHERE team_id = $1', [teamId]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const team = teamResult.rows[0];

    // Check if user is team leader
    if (team.leader_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can submit the project'
      });
    }

    // Check if team is confirmed
    if (team.confirmation_status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Team must be confirmed before submitting project'
      });
    }

    // Check if all team members have paid
    const membersResult = await query('SELECT payment_status FROM team_members WHERE team_id = $1', [team.team_id]);
    const allPaid = membersResult.rows.every(member => member.payment_status === 'paid');
    if (!allPaid) {
      return res.status(400).json({
        success: false,
        message: 'All team members must complete payment before submitting project'
      });
    }

    // Check if team already has a submission
    const existingResult = await query('SELECT id FROM submissions WHERE team_id = $1 LIMIT 1', [team.team_id]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This team has already submitted a project.'
      });
    }

    // Create new submission
    const id = uuidv4();
    const generatedSubmissionId = generateSubmissionId();

    const insertResult = await query(
      `INSERT INTO submissions (id, submission_id, team_id, project_name, description, presentation_url, code_url, demo_video_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted')
       RETURNING *`,
      [
        id,
        generatedSubmissionId,
        team.team_id,
        projectName,
        description || '',
        presentationUrl || null,
        codeUrl || null,
        demoVideoUrl || null
      ]
    );

    const newSubmission = formatSubmission(insertResult.rows[0]);

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

    const result = await query('SELECT * FROM submissions WHERE team_id = $1 LIMIT 1', [teamId]);

    const submission = result.rows.length > 0 ? formatSubmission(result.rows[0]) : null;

    res.status(200).json({
      success: true,
      data: submission
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
    const submissionId = req.params.submissionId || req.params.id;
    const updates = req.body;
    const userId = req.user.userId;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID is required'
      });
    }

    // Get submission
    const submissionResult = await query('SELECT * FROM submissions WHERE id = $1', [submissionId]);
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submission = submissionResult.rows[0];

    // Get team (by row's team_id code) to verify user is team leader
    const teamResult = await query('SELECT * FROM teams WHERE team_id = $1', [submission.team_id]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const team = teamResult.rows[0];

    // Check if user is team leader
    if (team.leader_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update the submission'
      });
    }

    // Map camelCase body keys to columns
    const columnMap = {
      projectName: 'project_name',
      description: 'description',
      presentationUrl: 'presentation_url',
      codeUrl: 'code_url',
      demoVideoUrl: 'demo_video_url',
      status: 'status'
    };

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [camelKey, column] of Object.entries(columnMap)) {
      if (updates[camelKey] !== undefined) {
        fields.push(`${column} = $${idx++}`);
        values.push(updates[camelKey]);
      }
    }

    if (fields.length === 0) {
      // Nothing to update — return current row as-is
      return res.status(200).json({
        success: true,
        message: 'Submission updated successfully',
        data: formatSubmission(submission)
      });
    }

    values.push(submissionId);

    const updateResult = await query(
      `UPDATE submissions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const updatedSubmission = formatSubmission(updateResult.rows[0]);

    res.status(200).json({
      success: true,
      message: 'Submission updated successfully',
      data: updatedSubmission
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

    const result = await query('SELECT * FROM submissions ORDER BY submitted_at DESC');
    const submissionsArray = result.rows.map(formatSubmission);

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
