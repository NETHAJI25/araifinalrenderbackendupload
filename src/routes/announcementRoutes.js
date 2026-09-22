const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes (no authentication required for announcements)
router.get('/', announcementController.getAll);
router.get('/published', announcementController.getPublished);

// Protected routes
router.post('/', authenticate, announcementController.create);
router.put('/:id', authenticate, announcementController.update);
router.delete('/:id', authenticate, announcementController.delete);

module.exports = router;