const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

function formatAnnouncement(row) {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

/**
 * Get all announcements
 */
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const announcementsArray = data.map(formatAnnouncement);

    res.status(200).json({
      success: true,
      data: announcementsArray
    });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get published announcements
 */
exports.getPublished = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const publishedAnnouncements = data.map(formatAnnouncement);

    res.status(200).json({
      success: true,
      data: publishedAnnouncements
    });
  } catch (error) {
    console.error('Get published announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Create announcement
 */
exports.create = async (req, res) => {
  try {
    const { title, content, priority, status } = req.body;

    // Validate input
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const id = uuidv4();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        id,
        title,
        content,
        priority: priority || 'Normal',
        status: status || 'published'
      })
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);

    const savedAnnouncement = formatAnnouncement(data);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: savedAnnouncement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during announcement creation'
    });
  }
};

/**
 * Update announcement
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Announcement ID is required'
      });
    }

    // Get announcement
    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Build update object for allowed fields
    const updateFields = {};

    if (updates.title !== undefined) {
      updateFields.title = updates.title;
    }
    if (updates.content !== undefined) {
      updateFields.content = updates.content;
    }
    if (updates.priority !== undefined) {
      updateFields.priority = updates.priority;
    }
    if (updates.status !== undefined) {
      updateFields.status = updates.status;
    }

    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .update(updateFields)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);

    const updatedAnnouncement = formatAnnouncement(data);

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during announcement update'
    });
  }
};

/**
 * Delete announcement
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Announcement ID is required'
      });
    }

    // Check if announcement exists
    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Delete announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during announcement deletion'
    });
  }
};
