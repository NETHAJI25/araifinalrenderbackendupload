const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorizeTeamLeader, authorizeAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticate, authorizeAdmin, teamController.getAllTeams);
router.get('/my', authenticate, teamController.getMyTeam);
router.get('/:teamId', authenticate, teamController.getTeam);
router.post('/', authenticate, teamController.createTeam);
router.post('/join/:teamId', authenticate, teamController.joinTeam);
router.post('/:teamId/confirm', authenticate, authorizeTeamLeader, teamController.confirmTeam);
router.put('/:teamId/problem-statement', authenticate, authorizeTeamLeader, teamController.updateTeamProblemStatement);
router.delete('/:teamId/leave', authenticate, teamController.leaveTeam);
router.post('/:teamId/complete', authenticate, authorizeTeamLeader, teamController.markTeamComplete);
router.post('/:teamId/reject', authenticate, authorizeAdmin, teamController.rejectTeam);
router.put('/:teamId/round', authenticate, authorizeAdmin, teamController.updateTeamRound);

module.exports = router;