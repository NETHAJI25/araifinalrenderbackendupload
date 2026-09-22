const firebaseAdmin = require('firebase-admin');

// Get Firebase Realtime Database reference
const db = firebaseAdmin.database();
const announcementsRef = db.ref('announcements');

/**
 * Get all announcements
 */
exports.getAll = async (req, res) => {
  try {
    const snapshot = await announcementsRef.once('value');
    const announcements = snapshot.exists() ? snapshot.val() : {};

    // Convert object to array and sort by createdAt descending
    const announcementsArray = Object.keys(announcements).map(key => ({
      ...announcements[key],
      id: key
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
    const snapshot = await announcementsRef.once('value');
    const announcements = snapshot.exists() ? snapshot.val() : {};

    // Filter published announcements and sort by createdAt descending
    const publishedAnnouncements = Object.keys(announcements)
      .filter(key => announcements[key].status === 'published')
      .map(key => ({
        ...announcements[key],
        id: key
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

    // Create new announcement
    const newAnnouncement = {
      title,
      content,
      priority: priority || 'Normal',
      status: status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to database
    const newAnnouncementRef = announcementsRef.push();
    await newAnnouncementRef.set(newAnnouncement);

    // Get the saved announcement with ID
    const savedSnapshot = await newAnnouncementRef.once('value');
    const savedAnnouncement = {
      ...savedSnapshot.val(),
      id: savedSnapshot.key
    };

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
    const announcementRef = announcementsRef.child(id);
    const snapshot = await announcementRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const announcement = snapshot.val();

    // Update announcement
    const updatedAnnouncement = {
      ...announcement,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save updated announcement
    await announcementRef.set(updatedAnnouncement);

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: {
        ...updatedAnnouncement,
        id
      }
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
    const announcementRef = announcementsRef.child(id);
    const snapshot = await announcementRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Delete announcement
    await announcementRef.remove();

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