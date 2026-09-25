const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

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
    const result = await query('SELECT * FROM announcements ORDER BY created_at DESC');
    const announcementsArray = result.rows.map(formatAnnouncement);

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
    const result = await query("SELECT * FROM announcements WHERE status = 'published' ORDER BY created_at DESC");
    const publishedAnnouncements = result.rows.map(formatAnnouncement);

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
    const result = await query(
      `INSERT INTO announcements (id, title, content, priority, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, title, content, priority || 'Normal', status || 'published']
    );

    const savedAnnouncement = formatAnnouncement(result.rows[0]);

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
    const existing = await query('SELECT * FROM announcements WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Build dynamic SET clause for allowed fields
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(updates.content);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      values.push(updates.priority);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE announcements SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const updatedAnnouncement = formatAnnouncement(result.rows[0]);

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
    const existing = await query('SELECT id FROM announcements WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Delete announcement
    await query('DELETE FROM announcements WHERE id = $1', [id]);

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
