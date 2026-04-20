const express = require('express');
const predictionRouter = express.Router();
const auth = require('../middleware/auth');
const { spendCoins } = require('../services/coinService');
const { query } = require('../config/database');

predictionRouter.post('/', auth, async (req, res) => {
  try {
    const { tournament_id, prediction_type, predicted_user_ids } = req.body;

    const ENTRY_COINS = 5;
    await spendCoins(req.user.id, ENTRY_COINS, 'prediction', `Prediction on tournament ${tournament_id}`);

    await query(
      `INSERT INTO predictions (tournament_id, user_id, prediction_type, predicted_user_ids, entry_coins)
       VALUES ($1,$2,$3,$4,$5)`,
      [tournament_id, req.user.id, prediction_type, predicted_user_ids, ENTRY_COINS]
    );

    res.json({ success: true, message: 'Prediction submitted! 5 BlazeGold deducted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Prediction failed' });
  }
});

module.exports = predictionRouter;
