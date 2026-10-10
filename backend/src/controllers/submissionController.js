const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

function formatSubmission(row) {
  if (!row) return null;
  return {
    id: row.id,
    teamId: row.team_id,
    projectTitle: row.project_title,
    description: row.description,
    githubUrl: row.github_url,
    demoUrl: row.demo_url,
    videoUrl: row.video_url,
    pptUrl: row.ppt_url,
    status: row.status,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
    reviewedAt: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : row.reviewed_at,
    reviewNotes: row.review_notes,
    score: row.score,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

exports.submitProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { teamId, projectTitle, description, githubUrl, demoUrl, videoUrl, pptUrl } = req.body;

    if (!teamId || !projectTitle) {
      return res.status(400).json({ success: false, message: 'Team ID and project title are required' });
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_id', teamId)
      .maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only team leader can submit' });
    }
    if (team.confirmation_status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Team must be confirmed before submission' });
    }
    if (team.round !== 2) {
      return res.status(400).json({ success: false, message: 'Submissions only allowed in Round 2' });
    }
    if (team.members.some(m => m.payment_status !== 'paid' && m.payment_status !== 'verified')) {
      return res.status(400).json({ success: false, message: 'All members must complete payment before submission' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Submission already exists for this team' });
    }

    const submissionId = uuidv4();
    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from('submissions').insert({
      id: uuidv4(),
      team_id: teamId,
      project_title: projectTitle,
      description,
      github_url: githubUrl,
      demo_url: demoUrl,
      video_url: videoUrl,
      ppt_url: pptUrl,
      status: 'submitted',
      submitted_at: now,
      created_at: now,
      updated_at: now
    });
    if (insertError) throw new Error(insertError.message);

    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('team_id', teamId)
      .single();
    if (error) throw new Error(error.message);

    res.status(201).json({ success: true, message: 'Project submitted successfully', data: formatSubmission(submission) });
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_id', teamId)
      .maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (!team.members?.some(m => m.user_id === userId)) {
      return res.status(403).json({ success: false, message: 'Not a member of this team' });
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('team_id', teamId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, data: formatSubmission(submission) });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectTitle, description, githubUrl, demoUrl, videoUrl, pptUrl } = req.body;
    const userId = req.user.userId;

    const { data: submission, error: findError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('leader_id')
      .eq('team_id', submission.team_id)
      .maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (team.leader_id !== userId) {
      return res.status(403).json({ success: false, message: 'Only team leader can update submission' });
    }

    const updateData = {
      project_title: projectTitle ?? submission.project_title,
      description: description ?? submission.description,
      github_url: githubUrl ?? submission.github_url,
      demo_url: demoUrl ?? submission.demo_url,
      video_url: videoUrl ?? submission.video_url,
      ppt_url: pptUrl ?? submission.ppt_url,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, message: 'Submission updated', data: formatSubmission(updated) });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) throw new Error(error.message);

    const formatted = submissions.map(formatSubmission);
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};