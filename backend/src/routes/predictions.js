const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tournamentController = require('../controllers/tournamentController');

/**
 * @route POST /api/predictions/place
 * @desc Place a prediction on a player's performance in a live tournament
 * @access Private
 */
router.post('/place', auth, tournamentController.placePrediction);

module.exports = router;
