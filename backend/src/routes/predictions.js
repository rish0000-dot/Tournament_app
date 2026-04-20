// routes/predictions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const predCtrl = require('../controllers/predictionController');

// Place a prediction on a live tournament
router.post('/place', auth, predCtrl.placePrediction);

// Get my active predictions
router.get('/my', auth, predCtrl.getMyPredictions);

// Get available predictions for a tournament
router.get('/tournament/:tournamentId', auth, predCtrl.getTournamentPredictions);

// Admin: settle predictions after tournament ends
router.post('/settle/:tournamentId', auth, predCtrl.settlePredictions);

module.exports = router;
