const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
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

    // Get current user
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get team by CODE
    const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('team_id', teamId).maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

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
    const { data: members, error: membersError } = await supabase.from('team_members').select('payment_status').eq('team_id', team.team_id);
    if (membersError) throw new Error(membersError.message);
    const allPaid = (members || []).every(member => member.payment_status === 'paid');
    if (!allPaid) {
      return res.status(400).json({
        success: false,
        message: 'All team members must complete payment before submitting project'
      });
    }

    // Check if team already has a submission
    const { data: existing, error: existingError } = await supabase.from('submissions').select('id').eq('team_id', team.team_id).limit(1).maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This team has already submitted a project.'
      });
    }

    // Create new submission
    const id = uuidv4();
    const generatedSubmissionId = generateSubmissionId();

    const { data: inserted, error: insertError } = await supabase.from('submissions').insert({
      id,
      submission_id: generatedSubmissionId,
      team_id: team.team_id,
      project_name: projectName,
      description: description || '',
      presentation_url: presentationUrl || null,
      code_url: codeUrl || null,
      demo_video_url: demoVideoUrl || null,
      status: 'submitted'
    }).select().maybeSingle();
    if (insertError) throw new Error(insertError.message);

    const newSubmission = formatSubmission(inserted);

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

    const { data: row, error } = await supabase.from('submissions').select('*').eq('team_id', teamId).limit(1).maybeSingle();
    if (error) throw new Error(error.message);

    const submission = row ? formatSubmission(row) : null;

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
    const { data: submission, error: submissionError } = await supabase.from('submissions').select('*').eq('id', submissionId).maybeSingle();
    if (submissionError) throw new Error(submissionError.message);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get team (by row's team_id code) to verify user is team leader
    const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('team_id', submission.team_id).maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

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

    const patch = {};
    for (const [camelKey, column] of Object.entries(columnMap)) {
      if (updates[camelKey] !== undefined) {
        patch[column] = updates[camelKey];
      }
    }

    if (Object.keys(patch).length === 0) {
      // Nothing to update — return current row as-is
      return res.status(200).json({
        success: true,
        message: 'Submission updated successfully',
        data: formatSubmission(submission)
      });
    }

    const { data: updated, error: updateError } = await supabase.from('submissions').update(patch).eq('id', submissionId).select().maybeSingle();
    if (updateError) throw new Error(updateError.message);

    const updatedSubmission = formatSubmission(updated);

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

    const { data: rows, error } = await supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
    if (error) throw new Error(error.message);
    const submissionsArray = (rows || []).map(formatSubmission);

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
