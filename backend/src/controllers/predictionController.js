// controllers/predictionController.js
const { query, queryOne, withTransaction } = require('../config/database');
const { awardCoins, spendCoins } = require('../services/coinService');
const logger = require('../utils/logger');

/**
 * Place a prediction on a player in a live tournament
 */
exports.placePrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournament_id, prediction_type, predicted_user_ids, entry_coins = 5 } = req.body;

    // Validate tournament is live
    const tournament = await queryOne('SELECT * FROM tournaments WHERE id=$1', [tournament_id]);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    if (tournament.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Predictions only allowed on live tournaments' });
    }

    // Check user is not a participant
    const isPlayer = await queryOne(
      'SELECT id FROM tournament_registrations WHERE tournament_id=$1 AND user_id=$2',
      [tournament_id, userId]
    );
    if (isPlayer) {
      return res.status(400).json({ success: false, message: 'Players cannot predict in their own tournament' });
    }

    // Check existing prediction
    const existing = await queryOne(
      'SELECT id FROM predictions WHERE tournament_id=$1 AND user_id=$2',
      [tournament_id, userId]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already placed a prediction on this tournament' });
    }

    // Spend BlazeGold coins
    await spendCoins(userId, entry_coins, 'prediction', `Prediction on tournament ${tournament.title}`);

    // Calculate potential payout multiplier based on type
    let multiplier = 2.0;
    if (prediction_type === 'winner') multiplier = 3.0;
    else if (prediction_type === 'top3') multiplier = 1.5;
    else if (prediction_type === 'kill_leader') multiplier = 2.5;

    const potential_win = entry_coins * multiplier;

    await query(
      `INSERT INTO predictions (tournament_id, user_id, prediction_type, predicted_user_ids, entry_coins, potential_win)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tournament_id, userId, prediction_type, predicted_user_ids, entry_coins, potential_win]
    );

    res.json({
      success: true,
      message: 'Prediction placed!',
      data: { entry_coins, potential_win, multiplier, prediction_type }
    });
  } catch (error) {
    if (error.message === 'Insufficient BlazeGold') {
      return res.status(400).json({ success: false, message: 'Not enough BlazeGold coins' });
    }
    logger.error('Place prediction error:', error);
    res.status(500).json({ success: false, message: 'Failed to place prediction' });
  }
};

/**
 * Get user's active/recent predictions
 */
exports.getMyPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const predictions = await query(`
      SELECT p.*, t.title as tournament_title, t.status as tournament_status,
        t.mode, t.prize_pool
      FROM predictions p
      JOIN tournaments t ON p.tournament_id = t.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 30
    `, [userId]);

    res.json({ success: true, data: { predictions: predictions.rows } });
  } catch (error) {
    logger.error('Get my predictions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch predictions' });
  }
};

/**
 * Get prediction stats for a tournament
 */
exports.getTournamentPredictions = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const stats = await query(`
      SELECT
        COUNT(*) as total_predictions,
        SUM(entry_coins) as total_pool,
        prediction_type,
        unnest(predicted_user_ids) as predicted_user,
        COUNT(*) as prediction_count
      FROM predictions
      WHERE tournament_id = $1
      GROUP BY prediction_type, predicted_user
      ORDER BY prediction_count DESC
    `, [tournamentId]);

    // Get registered players for prediction options
    const players = await query(`
      SELECT u.id, u.username, u.ff_username, u.avatar_url, u.total_wins, u.total_kills
      FROM tournament_registrations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.tournament_id = $1
      ORDER BY u.total_wins DESC
    `, [tournamentId]);

    res.json({
      success: true,
      data: {
        prediction_stats: stats.rows,
        players: players.rows,
        prediction_types: ['winner', 'top3', 'kill_leader']
      }
    });
  } catch (error) {
    logger.error('Get tournament predictions error:', error);
    res.status(500).json({ success: false, message: 'Failed' });
  }
};

/**
 * Settle predictions after a tournament completes
 */
exports.settlePredictions = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await queryOne('SELECT * FROM tournaments WHERE id=$1', [tournamentId]);
    if (!tournament || tournament.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Tournament must be completed to settle' });
    }

    // Get results
    const results = await query(
      'SELECT * FROM tournament_results WHERE tournament_id=$1 AND status=$2 ORDER BY rank ASC',
      [tournamentId, 'verified']
    );
    if (results.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No verified results yet' });
    }

    const winnerId = results.rows[0]?.user_id;
    const top3Ids = results.rows.slice(0, 3).map(r => r.user_id);
    const killLeaderId = results.rows.reduce((prev, cur) =>
      (cur.kills || 0) > (prev.kills || 0) ? cur : prev
    , results.rows[0])?.user_id;

    // Get unsettled predictions
    const predictions = await query(
      'SELECT * FROM predictions WHERE tournament_id=$1 AND settled_at IS NULL',
      [tournamentId]
    );

    let settledCount = 0;
    let totalPayout = 0;

    for (const pred of predictions.rows) {
      let isCorrect = false;

      switch (pred.prediction_type) {
        case 'winner':
          isCorrect = pred.predicted_user_ids?.includes(winnerId);
          break;
        case 'top3':
          isCorrect = pred.predicted_user_ids?.some(id => top3Ids.includes(id));
          break;
        case 'kill_leader':
          isCorrect = pred.predicted_user_ids?.includes(killLeaderId);
          break;
      }

      const payout = isCorrect ? pred.potential_win : 0;

      await query(
        `UPDATE predictions SET is_correct=$1, payout=$2, settled_at=NOW() WHERE id=$3`,
        [isCorrect, payout, pred.id]
      );

      if (isCorrect && payout > 0) {
        await awardCoins(pred.user_id, payout, 'prediction', tournamentId,
          `Prediction correct! ${pred.prediction_type} in ${tournament.title}`);
        totalPayout += payout;
      }

      settledCount++;
    }

    res.json({
      success: true,
      message: `Settled ${settledCount} predictions. Total payout: ${totalPayout} BlazeGold.`,
      data: { settled: settledCount, total_payout: totalPayout }
    });
  } catch (error) {
    logger.error('Settle predictions error:', error);
    res.status(500).json({ success: false, message: 'Failed to settle predictions' });
  }
};
