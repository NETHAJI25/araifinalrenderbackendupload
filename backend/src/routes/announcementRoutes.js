const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

router.get('/', announcementController.getAll);
router.get('/published', announcementController.getPublished);
router.post('/', authenticate, authorizeAdmin, announcementController.create);
router.put('/:id', authenticate, authorizeAdmin, announcementController.update);
router.delete('/:id', authenticate, authorizeAdmin, announcementController.delete);

module.exports = router;