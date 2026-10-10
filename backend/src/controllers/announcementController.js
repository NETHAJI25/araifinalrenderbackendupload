const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

function formatAnnouncement(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isPublished: row.is_published,
    publishAt: row.publish_at instanceof Date ? row.publish_at.toISOString() : row.publish_at,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

exports.getAll = async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const announcements = rows.map(formatAnnouncement);
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPublished = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data: rows, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .lte('publish_at', now)
      .order('publish_at', { ascending: false });
    if (error) throw new Error(error.message);

    const announcements = rows.map(formatAnnouncement);
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    console.error('Get published announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, isPublished, publishAt } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const announcementId = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const { data: inserted, error } = await supabase
      .from('announcements')
      .insert({
        id: announcementId,
        title,
        content,
        is_published: isPublished || false,
        publish_at: publishAt || now,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    res.status(201).json({ success: true, message: 'Announcement created', data: formatAnnouncement(inserted) });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished, publishAt } = req.body;

    const { data: existing, error: findError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updateData = {
      title: title ?? existing.title,
      content: content ?? existing.content,
      is_published: isPublished ?? existing.is_published,
      publish_at: publishAt ?? existing.publish_at,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, message: 'Announcement updated', data: formatAnnouncement(updated) });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};