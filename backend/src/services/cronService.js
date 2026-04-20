const cron = require('node-cron');
const { query, queryOne } = require('../config/database');
const { sendBulkNotification } = require('./notificationService');
const { expireOldCoins, generateDailyMissions } = require('./coinService');
const logger = require('../utils/logger');

// Every minute — check tournaments to set LIVE / send room IDs
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

    // Tournaments starting in 15 min — send room notification
    const upcoming = await query(`
      SELECT t.id, t.title, t.room_id, t.room_password, t.scheduled_at,
        array_agg(tr.user_id) as user_ids
      FROM tournaments t
      JOIN tournament_registrations tr ON t.id = tr.tournament_id
      WHERE t.status = 'registering'
      AND t.scheduled_at BETWEEN $1 AND $2
      AND t.room_released_at IS NULL
      AND t.room_id IS NOT NULL
      GROUP BY t.id
    `, [now, fifteenMinsLater]);

    for (const tournament of upcoming.rows) {
      // Mark room as released
      await query(
        'UPDATE tournaments SET room_released_at=NOW() WHERE id=$1',
        [tournament.id]
      );

      // Notify all registered players
      await sendBulkNotification(tournament.user_ids, {
        title: '🎮 Room ID Ready!',
        body: `${tournament.title} starts soon! Room: ${tournament.room_id} | Pass: ${tournament.room_password}`,
        data: {
          type: 'room_released',
          tournament_id: tournament.id,
          room_id: tournament.room_id,
          room_password: tournament.room_password
        }
      });

      logger.info(`Room released for tournament: ${tournament.title}`);
    }

    // Set tournaments to LIVE when scheduled time passes
    await query(`
      UPDATE tournaments SET status='live', started_at=NOW()
      WHERE status IN ('upcoming', 'registering')
      AND scheduled_at <= $1
    `, [now]);

    // Auto-complete tournaments after 45 minutes
    await query(`
      UPDATE tournaments SET status='completed', ended_at=NOW()
      WHERE status='live'
      AND started_at <= $1
    `, [new Date(now.getTime() - 45 * 60 * 1000)]);

  } catch (error) {
    logger.error('Cron tournament check error:', error);
  }
});

// Daily midnight — reset missions, expire coins, generate new missions
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running midnight cron jobs...');

    // Expire old coins
    await expireOldCoins();

    // Generate daily missions for active users (logged in last 7 days)
    const activeUsers = await query(`
      SELECT DISTINCT u.id FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.last_active >= NOW() - INTERVAL '7 days'
    `);

    for (const user of activeUsers.rows) {
      await generateDailyMissions(user.id);
    }

    logger.info('Midnight cron complete');
  } catch (error) {
    logger.error('Midnight cron error:', error);
  }
});

// Every hour — coin expiry warnings (7 days before)
cron.schedule('0 * * * *', async () => {
  try {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiringUsers = await query(`
      SELECT DISTINCT user_id, SUM(amount) as expiring_amount
      FROM coin_transactions
      WHERE expires_at BETWEEN NOW() AND $1
      AND amount > 0
      GROUP BY user_id
    `, [sevenDaysLater]);

    for (const row of expiringUsers.rows) {
      await sendBulkNotification([row.user_id], {
        title: '⚠️ BlazeGold Expiring Soon!',
        body: `${row.expiring_amount} BlazeGold will expire in 7 days. Use or redeem now!`,
        data: { type: 'coin_expiry_warning' }
      });
    }
  } catch (error) {
    logger.error('Expiry warning cron error:', error);
  }
});

logger.info('✅ Cron jobs initialized');
