// controllers/tournamentController.js
const { query, queryOne, withTransaction } = require('../config/database');
const { cacheTournament, getCachedTournament, invalidateTournament } = require('../config/redis');
const { awardCoins } = require('../services/coinService');

const { sendPushNotification } = require('../services/notificationService');
const { uploadToS3 } = require('../services/storageService');
const { verifyScreenshot } = require('../services/ocrService');
const logger = require('../utils/logger');

// ============================================
// GET ALL TOURNAMENTS (with filters)
// ============================================
exports.getTournaments = async (req, res) => {
  try {
    const { mode, status, is_free, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE t.status IN ($1, $2)';
    let params = ['upcoming', 'registering'];
    let paramCount = 2;

    if (mode) { paramCount++; whereClause += ` AND t.mode = $${paramCount}`; params.push(mode); }
    if (is_free === 'true') { paramCount++; whereClause += ` AND t.is_free = $${paramCount}`; params.push(true); }
    if (status) {
      whereClause = `WHERE t.status = $1`;
      params = [status];
      paramCount = 1;
    }

    paramCount++; params.push(parseInt(limit));
    paramCount++; params.push(parseInt(offset));

    const tournaments = await query(`
      SELECT
        t.*,
        COUNT(tr.id) as registered_count,
        (t.total_slots - COUNT(tr.id)) as slots_remaining
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.scheduled_at ASC
      LIMIT $${paramCount-1} OFFSET $${paramCount}
    `, params);

    res.json({ success: true, data: { tournaments: tournaments.rows } });
  } catch (error) {
    logger.error('Get tournaments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tournaments' });
  }
};

// ============================================
// GET SINGLE TOURNAMENT
// ============================================
exports.getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Try cache
    const cached = await getCachedTournament(id);
    if (cached && !userId) return res.json({ success: true, data: cached });

    const tournament = await queryOne(`
      SELECT t.*,
        COUNT(tr.id) as registered_count
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id]);

    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Check if user registered
    let userRegistration = null;
    if (userId) {
      userRegistration = await queryOne(
        'SELECT * FROM tournament_registrations WHERE tournament_id=$1 AND user_id=$2',
        [id, userId]
      );
    }

    // Get registered players
    const players = await query(`
      SELECT u.username, u.ff_username, u.avatar_url, tr.slot_number, tr.registered_at
      FROM tournament_registrations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.tournament_id = $1
      ORDER BY tr.registered_at ASC
    `, [id]);

    // Don't show room ID until 15 min before
    // Don't show mode for blind drops until 10 min before
    const now = new Date();
    const matchTime = new Date(tournament.scheduled_at);
    const minutesUntilMatch = (matchTime - now) / 1000 / 60;

    const room_revealed = minutesUntilMatch <= 15;
    const is_blind = tournament.is_blind_drop || tournament.mode === 'blind_drop';
    const blind_revealed = minutesUntilMatch <= 10;

    const response = {
      ...tournament,
      mode: (is_blind && !blind_revealed) ? 'blind_drop' : tournament.mode,
      players: players.rows,
      user_registration: userRegistration,
      room_revealed,
      blind_revealed,
      room_id: room_revealed ? tournament.room_id : null,
      room_password: room_revealed ? tournament.room_password : null,
    };

    await cacheTournament(id, response);
    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Get tournament error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tournament' });
  }
};

// ============================================
// JOIN TOURNAMENT
// ============================================
exports.joinTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { payment_method } = req.body;

    const tournament = await queryOne(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    if (tournament.status !== 'upcoming' && tournament.status !== 'registering') {
      return res.status(400).json({ success: false, message: 'Registration closed' });
    }
    if (tournament.filled_slots >= tournament.total_slots) {
      return res.status(400).json({ success: false, message: 'Tournament is full' });
    }

    // Check if already registered
    const existing = await queryOne(
      'SELECT id FROM tournament_registrations WHERE tournament_id=$1 AND user_id=$2',
      [id, userId]
    );
    if (existing) return res.status(400).json({ success: false, message: 'Already registered' });

    // Check if user profile is complete
    const user = await queryOne('SELECT * FROM users WHERE id=$1', [userId]);
    if (!user.ff_uid) return res.status(400).json({ success: false, message: 'Please link your Free Fire account first' });

    await withTransaction(async (client) => {
      let transactionId = null;

      // Handle entry fee
      if (tournament.entry_fee > 0) {
        const wallet = await queryOne('SELECT * FROM wallets WHERE user_id=$1 FOR UPDATE', [userId]);

        if (wallet.real_cash < tournament.entry_fee) {
          if (wallet.bonus_cash >= tournament.entry_fee) {
            // Use bonus cash
            await client.query(
              'UPDATE wallets SET bonus_cash = bonus_cash - $1 WHERE user_id = $2',
              [tournament.entry_fee, userId]
            );
          } else {
            throw new Error('Insufficient balance');
          }
        } else {
          // Deduct from real cash
          await client.query(
            'UPDATE wallets SET real_cash = real_cash - $1 WHERE user_id = $2',
            [tournament.entry_fee, userId]
          );
        }

        // Create transaction record
        const tx = await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, description, tournament_id)
           VALUES ($1, 'tournament_entry', $2, 'completed', $3, $4) RETURNING id`,
          [userId, tournament.entry_fee, `Entry: ${tournament.title}`, id]
        );
        transactionId = tx.rows[0].id;
      }

      // Assign slot number
      const slotResult = await client.query(
        'SELECT COALESCE(MAX(slot_number), 0) + 1 as next_slot FROM tournament_registrations WHERE tournament_id=$1',
        [id]
      );
      const slotNumber = slotResult.rows[0].next_slot;

      // Register
      await client.query(
        `INSERT INTO tournament_registrations (tournament_id, user_id, slot_number, entry_paid, payment_transaction_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, userId, slotNumber, tournament.entry_fee > 0, transactionId]
      );

      // Update filled slots + status
      await client.query(
        `UPDATE tournaments
         SET filled_slots = filled_slots + 1,
             status = CASE WHEN filled_slots + 1 >= total_slots THEN 'registering' ELSE status END
         WHERE id = $1`,
        [id]
      );
    });

    await invalidateTournament(id);

    // Send confirmation notification
    await sendPushNotification(userId, {
      title: '✅ Registered!',
      body: `You're in: ${tournament.title}. Room ID will be shared 15 min before match.`,
      data: { type: 'tournament_registered', tournament_id: id }
    });

    res.json({
      success: true,
      message: 'Successfully joined tournament! Check back 15 minutes before match for Room ID.',
      data: { tournament_id: id, title: tournament.title, scheduled_at: tournament.scheduled_at }
    });
  } catch (error) {
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ success: false, message: 'Insufficient balance. Please add money to your wallet.' });
    }
    logger.error('Join tournament error:', error);
    res.status(500).json({ success: false, message: 'Failed to join tournament' });
  }
};

// ============================================
// SUBMIT RESULT
// ============================================
exports.submitResult = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { kills, rank, room_code_confirm } = req.body;
    const screenshotFile = req.file;

    if (!screenshotFile) return res.status(400).json({ success: false, message: 'Screenshot required' });

    const registration = await queryOne(
      'SELECT * FROM tournament_registrations WHERE tournament_id=$1 AND user_id=$2',
      [id, userId]
    );
    if (!registration) return res.status(403).json({ success: false, message: 'You are not registered in this tournament' });

    // Check existing result
    const existingResult = await queryOne(
      'SELECT id FROM tournament_results WHERE tournament_id=$1 AND user_id=$2',
      [id, userId]
    );
    if (existingResult) return res.status(400).json({ success: false, message: 'Result already submitted' });

    // Upload screenshot to S3
    const screenshotUrl = await uploadToS3(screenshotFile, `results/${id}/${userId}`);

    // Run OCR verification
    const ocrData = await verifyScreenshot(screenshotUrl);
    const ocrKills = ocrData.kills;
    const ocrRank = ocrData.rank;

    // Check if OCR matches submitted data
    const killsMatch = Math.abs(ocrKills - parseInt(kills)) <= 1; // Allow 1 kill tolerance
    const rankMatch = ocrRank === parseInt(rank);
    const autoVerified = killsMatch && rankMatch;

    // Insert result
    const result = await queryOne(
      `INSERT INTO tournament_results
       (tournament_id, user_id, rank, kills, screenshot_url, ocr_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, userId, rank, kills, screenshotUrl, JSON.stringify(ocrData),
       autoVerified ? 'verified' : 'pending']
    );

    // If auto-verified, credit prize immediately
    if (autoVerified) {
      await creditPrize(id, userId, parseInt(rank), parseInt(kills), result.id);
    }

    res.json({
      success: true,
      message: autoVerified
        ? 'Result verified! Prize credited to your wallet.'
        : 'Result submitted! Under review (usually within 30 minutes).',
      data: {
        status: autoVerified ? 'verified' : 'pending',
        auto_verified: autoVerified
      }
    });
  } catch (error) {
    logger.error('Submit result error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit result' });
  }
};

// ============================================
// CREDIT PRIZE (Internal function)
// ============================================
const creditPrize = async (tournamentId, userId, rank, kills, resultId) => {
  try {
    const tournament = await queryOne('SELECT * FROM tournaments WHERE id=$1', [tournamentId]);
    const user = await queryOne('SELECT * FROM users WHERE id=$1', [userId]);

    let prizeAmount = 0;
    let coinAmount = 0;

    if (tournament.is_free) {
      // Coin-based prizes for free tournaments
      const coinMap = { 1: 150, 2: 80, 3: 50 };
      const rankCoin = rank <= 3 ? coinMap[rank] : rank <= 10 ? 25 : rank <= 50 ? 5 : 0;

      // Win streak multiplier
      const streak = user.current_win_streak || 0;
      let multiplier = 1;
      if (rank === 1) {
        if (streak >= 10) multiplier = 5;
        else if (streak >= 5) multiplier = 3;
        else if (streak >= 3) multiplier = 2;
        else if (streak >= 2) multiplier = 1.5;
      }

      const baseCoins = rankCoin + (kills * 3);
      coinAmount = Math.floor(baseCoins * multiplier);

      await awardCoins(userId, coinAmount, 'tournament_rank', tournamentId,
        `Rank #${rank} in ${tournament.title}${multiplier > 1 ? ` (${multiplier}x streak bonus!)` : ''}`
      );

      // Update streak
      if (rank === 1) {
        await query(
          `UPDATE users SET
            current_win_streak = current_win_streak + 1,
            best_win_streak = GREATEST(best_win_streak, current_win_streak + 1),
            total_wins = total_wins + 1,
            total_matches = total_matches + 1,
            total_kills = total_kills + $1
          WHERE id = $2`,
          [kills, userId]
        );
      } else {
        await query(
          `UPDATE users SET
            current_win_streak = 0,
            total_matches = total_matches + 1,
            total_kills = total_kills + $1
          WHERE id = $2`,
          [kills, userId]
        );
      }
    } else {
      // Real cash prize
      const distribution = tournament.prize_distribution || {};
      prizeAmount = distribution[rank.toString()] || 0;

      if (tournament.mode === 'solo_per_kill') {
        prizeAmount = Math.min(kills, 25) * (tournament.per_kill_rate || 10);
      }

      if (prizeAmount > 0) {
        await withTransaction(async (client) => {
          await client.query(
            'UPDATE wallets SET real_cash = real_cash + $1, total_won = total_won + $1 WHERE user_id = $2',
            [prizeAmount, userId]
          );
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, status, description, tournament_id)
             VALUES ($1, 'tournament_win', $2, 'completed', $3, $4)`,
            [userId, prizeAmount, `Prize: Rank #${rank} in ${tournament.title}`, tournamentId]
          );
        });
      }

      await query(
        `UPDATE users SET total_matches=total_matches+1, total_kills=total_kills+$1,
          total_wins = total_wins + $2 WHERE id=$3`,
        [kills, rank === 1 ? 1 : 0, userId]
      );
    }

    // Update result record
    await query(
      `UPDATE tournament_results
       SET prize_amount=$1, coin_amount=$2, prize_credited=TRUE, status='verified'
       WHERE id=$3`,
      [prizeAmount, coinAmount, resultId]
    );

    // Update bounty system
    if (rank === 1) {
      await query(
        `INSERT INTO bounties (target_user_id, amount)
         VALUES ($1, 50)
         ON CONFLICT (target_user_id)
         DO UPDATE SET amount = bounties.amount + 5, updated_at=NOW()`,
        [userId]
      );
    }

    // Trigger Last Bullet 1v1 if applicable (Top 2 move to sudden death)
    if (rank === 1 || rank === 2) {
      // Find the "other" top player
      const otherRank = rank === 1 ? 2 : 1;
      const opponent = await queryOne(
        'SELECT id FROM tournament_results WHERE tournament_id=$1 AND rank=$2',
        [tournamentId, otherRank]
      );

      if (opponent) {
        // Create 1v1 challenge record
        await query(
          `INSERT INTO last_bullet_challenges (tournament_id, player1_id, player2_id, status, expires_at)
           VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '5 minutes')
           ON CONFLICT DO NOTHING`,
          [tournamentId, userId, opponent.id]
        );

        // Notify both players
        await sendPushNotification(userId, {
          title: '🔥 Last Bullet Challenge!',
          body: `You and your rival are the top 2! 1v1 challenge initiated for prize boost.`,
          data: { type: 'last_bullet_trigger', tournament_id: tournamentId }
        });
      }
    }

    // Send notification
    const message = tournament.is_free
      ? `🪙 ${coinAmount} BlazeGold credited for Rank #${rank}!`
      : `🎉 ₹${prizeAmount} credited for Rank #${rank}!`;

    await sendPushNotification(userId, {
      title: '💰 Prize Credited!',
      body: message,
      data: { type: 'prize_credited', tournament_id: tournamentId }
    });
  } catch (error) {
    logger.error('Credit prize error:', error);
  }
};

exports.creditPrize = creditPrize;

// ============================================
// GET MY TOURNAMENTS
// ============================================
exports.getMyTournaments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const tournaments = await query(`
      SELECT t.*, tr.registered_at, tr.status as reg_status,
        res.rank, res.kills, res.prize_amount, res.coin_amount, res.status as result_status
      FROM tournament_registrations tr
      JOIN tournaments t ON tr.tournament_id = t.id
      LEFT JOIN tournament_results res ON res.tournament_id=t.id AND res.user_id=$1
      WHERE tr.user_id = $1
      ORDER BY tr.registered_at DESC
      LIMIT 50
    `, [userId]);

    res.json({ success: true, data: { tournaments: tournaments.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tournaments' });
  }
};

/**
 * placePrediction: Allow spectators to predict winners for rewards
 */
exports.placePrediction = async (req, res) => {
  try {
    const { tournamentId, targetUserId, amount } = req.body;
    const userId = req.user.id;

    if (amount <= 0) return res.status(400).json({ success: false, message: 'Invalid prediction amount' });

    await withTransaction(async (client) => {
      // 1. Check user balance
      const user = await client.query('SELECT coin_balance FROM users WHERE id = $1', [userId]);
      if (user.rows[0].coin_balance < amount) {
        throw new Error('Insufficient BlazeGold coins');
      }

      // 2. Verify tournament is LIVE
      const tournament = await client.query('SELECT status FROM tournaments WHERE id = $1', [tournamentId]);
      if (!tournament.rows[0] || tournament.rows[0].status !== 'live') {
        throw new Error('Predictions can only be placed on Live tournaments');
      }

      // 3. Subtract coins
      await client.query('UPDATE users SET coin_balance = coin_balance - $1 WHERE id = $2', [amount, userId]);

      // 4. Record prediction (Multiplier logic based on PRD: 2x base for now)
      await client.query(
        `INSERT INTO predictions (user_id, tournament_id, target_user_id, amount, multiplier, status)
         VALUES ($1, $2, $3, $4, 2.0, 'pending')`,
        [userId, tournamentId, targetUserId, amount]
      );
    });

    res.json({ success: true, message: 'Prediction placed! Good luck!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error placing prediction' });
  }
};
