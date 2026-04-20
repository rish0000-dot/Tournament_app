const express = require('express');
const coinRouter = express.Router();
const { rewardAdWatch, generateDailyMissions, checkAndAwardMission } = require('../services/coinService');
const { query } = require('../config/database');
const auth = require('../middleware/auth');

// Watch ad and earn coins
coinRouter.post('/ad-watch', auth, async (req, res) => {
  try {
    const result = await rewardAdWatch(req.user.id);
    res.json({ success: result.success, data: result, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process ad reward' });
  }
});

// Get daily missions
coinRouter.get('/missions', auth, async (req, res) => {
  try {
    await generateDailyMissions(req.user.id);
    const today = new Date().toISOString().split('T')[0];
    const missions = await query(
      'SELECT * FROM daily_missions WHERE user_id=$1 AND date=$2',
      [req.user.id, today]
    );
    res.json({ success: true, data: { missions: missions.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch missions' });
  }
});

// Get coin history
coinRouter.get('/history', auth, async (req, res) => {
  try {
    const coins = await query(
      `SELECT * FROM coin_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: { transactions: coins.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch coin history' });
  }
});

module.exports = coinRouter;
