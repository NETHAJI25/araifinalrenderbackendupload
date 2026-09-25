const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate } = require('../middleware/authMiddleware');

// Protected routes (leadership verified inside controllers via body/row team_id)
router.post('/', authenticate, submissionController.submitProject);
router.get('/my/:teamId', authenticate, submissionController.getMySubmission);
router.put('/:id', authenticate, submissionController.updateSubmission);
router.get('/', authenticate, submissionController.getAll); // Admin only

module.exports = router;