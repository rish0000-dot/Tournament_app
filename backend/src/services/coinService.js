// services/coinService.js
const { query, queryOne, withTransaction } = require('../config/database');
const logger = require('../utils/logger');

const COIN_EXPIRY_DAYS = parseInt(process.env.COIN_EXPIRY_DAYS) || 45;

// ============================================
// AWARD COINS TO USER
// ============================================
const awardCoins = async (userId, amount, type, tournamentId = null, description = '', multiplier = 1.0) => {
  try {
    const finalAmount = Math.floor(amount * multiplier);
    if (finalAmount <= 0) return 0;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + COIN_EXPIRY_DAYS);

    await withTransaction(async (client) => {
      // Add coin transaction record
      await client.query(
        `INSERT INTO coin_transactions
         (user_id, amount, type, tournament_id, streak_multiplier, expires_at, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, finalAmount, type, tournamentId, multiplier, expiresAt, description]
      );

      // Update wallet blazegold balance
      await client.query(
        'UPDATE wallets SET blazegold = blazegold + $1, updated_at=NOW() WHERE user_id=$2',
        [finalAmount, userId]
      );
    });

    logger.info(`Awarded ${finalAmount} BlazeGold to user ${userId} (type: ${type})`);
    return finalAmount;
  } catch (error) {
    logger.error('Award coins error:', error);
    return 0;
  }
};

// ============================================
// SPEND COINS
// ============================================
const spendCoins = async (userId, amount, type, description = '') => {
  try {
    const wallet = await queryOne('SELECT blazegold FROM wallets WHERE user_id=$1', [userId]);
    if (wallet.blazegold < amount) throw new Error('Insufficient BlazeGold');

    await withTransaction(async (client) => {
      await client.query(
        'UPDATE wallets SET blazegold=blazegold-$1 WHERE user_id=$2',
        [amount, userId]
      );
      await client.query(
        `INSERT INTO coin_transactions (user_id, amount, type, description)
         VALUES ($1, $2, $3, $4)`,
        [userId, -amount, type, description]
      );
    });

    return true;
  } catch (error) {
    logger.error('Spend coins error:', error);
    throw error;
  }
};

// ============================================
// CALCULATE STREAK MULTIPLIER
// ============================================
const getStreakMultiplier = (winStreak) => {
  if (winStreak >= 10) return 5.0;
  if (winStreak >= 5) return 3.0;
  if (winStreak >= 3) return 2.0;
  if (winStreak >= 2) return 1.5;
  return 1.0;
};

// ============================================
// AWARD DAILY MISSION COINS
// ============================================
const checkAndAwardMission = async (userId, missionType, progress = 1) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const mission = await queryOne(
      `SELECT * FROM daily_missions
       WHERE user_id=$1 AND date=$2 AND mission_type=$3`,
      [userId, today, missionType]
    );

    if (!mission || mission.completed) return null;

    const newProgress = mission.progress + progress;
    const completed = newProgress >= mission.target;

    await query(
      `UPDATE daily_missions
       SET progress=$1, completed=$2, completed_at=$3
       WHERE id=$4`,
      [Math.min(newProgress, mission.target), completed, completed ? new Date() : null, mission.id]
    );

    if (completed) {
      await awardCoins(userId, mission.coin_reward, 'mission', null,
        `Mission complete: ${missionType}`);
      return { completed: true, coins: mission.coin_reward };
    }

    return { completed: false, progress: newProgress, target: mission.target };
  } catch (error) {
    logger.error('Check mission error:', error);
    return null;
  }
};

// ============================================
// GENERATE DAILY MISSIONS FOR USER
// ============================================
const generateDailyMissions = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if already generated today
    const existing = await queryOne(
      'SELECT id FROM daily_missions WHERE user_id=$1 AND date=$2 LIMIT 1',
      [userId, today]
    );
    if (existing) return;

    const missions = [
      { type: 'play_tournaments', target: 2, reward: 30 },
      { type: 'get_kills', target: 5, reward: 25 },
      { type: 'watch_match', target: 1, reward: 15 },
    ];

    for (const m of missions) {
      await query(
        `INSERT INTO daily_missions (user_id, date, mission_type, target, coin_reward)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, date, mission_type) DO NOTHING`,
        [userId, today, m.type, m.target, m.reward]
      );
    }
  } catch (error) {
    logger.error('Generate missions error:', error);
  }
};

// ============================================
// EXPIRE OLD COINS (Run nightly)
// ============================================
const expireOldCoins = async () => {
  try {
    const expired = await query(`
      SELECT user_id, SUM(amount) as total_expired
      FROM coin_transactions
      WHERE expires_at < NOW() AND amount > 0 AND type != 'redeem'
      GROUP BY user_id
    `);

    for (const row of expired.rows) {
      // This is complex — in practice track per-batch
      // Simplified: just log for now, implement FIFO queue in production
      logger.info(`Coins to expire for user ${row.user_id}: ${row.total_expired}`);
    }
  } catch (error) {
    logger.error('Expire coins error:', error);
  }
};

// ============================================
// AD WATCH REWARD
// ============================================
const rewardAdWatch = async (userId) => {
  const { incrementAdWatch, getAdWatchCount } = require('../config/redis');
  const MAX_ADS = 5;

  const count = await incrementAdWatch(userId);
  if (count > MAX_ADS) {
    return { success: false, message: 'Maximum ads watched for today' };
  }

  const coins = await awardCoins(userId, 5, 'ad_watch', null, `Ad watched (${count}/${MAX_ADS})`);
  await checkAndAwardMission(userId, 'watch_match', 1);

  return {
    success: true,
    coins_earned: coins,
    ads_watched_today: count,
    ads_remaining: MAX_ADS - count
  };
};

module.exports = {
  awardCoins,
  spendCoins,
  getStreakMultiplier,
  checkAndAwardMission,
  generateDailyMissions,
  expireOldCoins,
  rewardAdWatch
};
