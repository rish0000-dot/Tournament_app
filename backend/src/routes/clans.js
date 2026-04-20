const express = require('express');
const clanRouter = express.Router();
const auth = require('../middleware/auth');
const clanController = require('../controllers/clanController');

// Create a new clan
clanRouter.post('/', auth, clanController.createClan);

// Join a clan
clanRouter.post('/:clanId/join', auth, clanController.joinClan);

// Get clan leaderboard
clanRouter.get('/leaderboard', clanController.getLeaderboard);

// Get specific clan details
clanRouter.get('/:clanId', auth, clanController.getClanDetails);

module.exports = clanRouter;
