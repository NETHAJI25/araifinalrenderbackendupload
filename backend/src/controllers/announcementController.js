const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// `announcements` table columns: id, title, content, priority, status,
// created_at, updated_at. `status` is 'draft' | 'published', `priority` is
// 'Normal' | 'Important' | 'Urgent' — matching the frontend Announcement type.
const PRIORITIES = ['Normal', 'Important', 'Urgent'];
const STATUSES = ['draft', 'published'];

function formatAnnouncement(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: PRIORITIES.includes(row.priority) ? row.priority : 'Normal',
    status: row.status === 'draft' ? 'draft' : 'published',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Accept both the frontend payload ({ priority, status }) and the legacy
// { isPublished } flag. Returns undefined for fields the caller didn't send,
// so updates can fall back to the existing row values.
function normalizeAnnouncementInput(body) {
  let status;
  if (STATUSES.includes(body.status)) status = body.status;
  else if (typeof body.isPublished === 'boolean') status = body.isPublished ? 'published' : 'draft';

  return {
    title: body.title,
    content: body.content,
    priority: PRIORITIES.includes(body.priority) ? body.priority : undefined,
    status
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
    const { data: rows, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
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
    const { title, content, priority, status } = normalizeAnnouncementInput(req.body);
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // The id column is uuid (NOT NULL, no DB default) — generate one server-side.
    const now = new Date().toISOString();

    const { data: inserted, error } = await supabase
      .from('announcements')
      .insert({
        id: uuidv4(),
        title,
        content,
        priority: priority || 'Normal',
        status: status || 'published',
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
    const { title, content, priority, status } = normalizeAnnouncementInput(req.body);

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
      priority: priority ?? existing.priority ?? 'Normal',
      status: status ?? existing.status ?? 'published',
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
