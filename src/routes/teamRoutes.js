const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorizeTeamLeader } = require('../middleware/authMiddleware');

// Public routes
router.get('/', authenticate, teamController.getAllTeams); // Admin only
router.get('/my', authenticate, teamController.getMyTeam);
router.get('/:teamId', authenticate, teamController.getTeam);

// Protected routes
router.post('/', authenticate, teamController.createTeam);
router.post('/join/:teamId', authenticate, teamController.joinTeam);
router.post('/:teamId/confirm', authenticate, authorizeTeamLeader, teamController.confirmTeam);
router.put('/:teamId/problem-statement', authenticate, authorizeTeamLeader, teamController.updateTeamProblemStatement);
router.delete('/:teamId/leave', authenticate, teamController.leaveTeam);
router.post('/:teamId/complete', authenticate, authorizeTeamLeader, teamController.markTeamComplete);
router.post('/:teamId/reject', authenticate, teamController.rejectTeam); // Admin only

module.exports = router;