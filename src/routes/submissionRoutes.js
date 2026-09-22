const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, authorizeTeamLeader } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', authenticate, authorizeTeamLeader, submissionController.submitProject);
router.get('/my/:teamId', authenticate, submissionController.getMySubmission);
router.put('/:id', authenticate, authorizeTeamLeader, submissionController.updateSubmission);
router.get('/', authenticate, submissionController.getAll); // Admin only

module.exports = router;