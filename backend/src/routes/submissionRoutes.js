const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, submissionController.submitProject);
router.get('/my/:teamId', authenticate, submissionController.getMySubmission);
router.put('/:id', authenticate, submissionController.updateSubmission);
router.get('/', authenticate, authorizeAdmin, submissionController.getAll);

module.exports = router;