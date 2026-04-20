const { query, queryOne, withTransaction } = require('../config/database');

/**
 * Place a bet on a tournament prediction
 */
exports.placeBet = async (req, res) => {
  try {
    const { tournamentId, type, predictionValue, amount } = req.body;
    const userId = req.user.id;

    if (amount <= 0) return res.status(400).json({ success: false, message: 'Invalid bet amount' });

    // 1. Check user balance (BlazeGold)
    const user = await queryOne('SELECT coin_balance FROM users WHERE id = $1', [userId]);
    if (user.coin_balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient BlazeGold balance' });
    }

    // 2. Verify tournament is active for betting
    const tournament = await queryOne(
      "SELECT status FROM tournaments WHERE id = $1 AND status = 'starting'",
      [tournamentId]
    );
    if (!tournament) {
      return res.status(400).json({ success: false, message: 'Betting is closed for this match' });
    }

    await withTransaction(async (client) => {
      // Deduct coins
      await client.query(
        'UPDATE users SET coin_balance = coin_balance - $1 WHERE id = $2',
        [amount, userId]
      );

      // Record bet
      await client.query(
        `INSERT INTO prediction_bets (user_id, tournament_id, type, predicted_value, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, tournamentId, type, predictionValue, amount]
      );

      // Update prediction pool
      await client.query(
        `INSERT INTO predictions (tournament_id, type, total_pool)
         VALUES ($1, $2, $3)
         ON CONFLICT (tournament_id, type)
         DO UPDATE SET total_pool = predictions.total_pool + $3`,
        [tournamentId, type, amount]
      );
    });

    res.json({ success: true, message: 'Bet placed successfully!' });
  } catch (err) {
    console.error('Bet Error:', err);
    res.status(500).json({ success: false, message: 'Failed to place bet' });
  }
};

/**
 * Get active predictions and pools for a tournament
 */
exports.getTournamentPredictions = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const predictions = await query(
      'SELECT type, total_pool, winning_value FROM predictions WHERE tournament_id = $1',
      [tournamentId]
    );
    res.json({ success: true, data: predictions.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch predictions' });
  }
};

/**
 * Internal: Settle all bets for a tournament type after results are finalized
 */
exports.settlePredictions = async (tournamentId, type, actualWinner) => {
  try {
    await withTransaction(async (client) => {
      // 1. Mark winning value
      await client.query(
        'UPDATE predictions SET winning_value = $1, status = "settled" WHERE tournament_id = $2 AND type = $3',
        [actualWinner, tournamentId, type]
      );

      // 2. Calculate Total Pool and Winning Pool
      const poolRes = await client.query(
        'SELECT total_pool FROM predictions WHERE tournament_id = $1 AND type = $2',
        [tournamentId, type]
      );
      const totalPool = parseFloat(poolRes.rows[0].total_pool);
      const netPool = totalPool * 0.95; // 5% fee as per PRD

      const winnersRes = await client.query(
        'SELECT SUM(amount) as win_pool FROM prediction_bets WHERE tournament_id = $1 AND type = $2 AND predicted_value = $3',
        [tournamentId, type, actualWinner]
      );
      const winningPoolTotal = parseFloat(winnersRes.rows[0].win_pool || 0);

      if (winningPoolTotal > 0) {
        // 3. Distribute rewards proportionally
        const winners = await client.query(
          'SELECT user_id, amount FROM prediction_bets WHERE tournament_id = $1 AND type = $2 AND predicted_value = $3',
          [tournamentId, type, actualWinner]
        );

        for (const winner of winners.rows) {
          const payout = (parseFloat(winner.amount) / winningPoolTotal) * netPool;
          await client.query(
            'UPDATE users SET coin_balance = coin_balance + $1 WHERE id = $2',
            [payout, winner.user_id]
          );
        }
      }
    });
    return true;
  } catch (err) {
    console.error('Settlement Error:', err);
    return false;
  }
};
