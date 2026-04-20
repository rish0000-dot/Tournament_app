const express = require('express');
const adminRouter = express.Router();
const auth = require('../middleware/auth');
const { query, queryOne } = require('../config/database');
const { creditPrize } = require('../controllers/tournamentController');

const adminAuth = async (req, res, next) => {
  // Simple admin check — in production use separate admin JWT
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ success: false, message: 'Admin access denied' });
  }
  next();
};

adminRouter.post('/tournament', adminAuth, async (req, res) => {
  try {
    const t = req.body;
    const result = await query(
      `INSERT INTO tournaments
       (title, mode, entry_fee, prize_pool, total_slots, scheduled_at, is_free, is_blind_drop, prize_distribution, per_kill_rate, rules, map)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [t.title, t.mode, t.entry_fee||0, t.prize_pool, t.total_slots, t.scheduled_at,
       t.is_free||false, t.is_blind_drop||false, JSON.stringify(t.prize_distribution||{}),
       t.per_kill_rate||null, t.rules||'', t.map||'']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create tournament' });
  }
});

adminRouter.patch('/tournament/:id/room', adminAuth, async (req, res) => {
  try {
    const { room_id, room_password } = req.body;
    await query(
      'UPDATE tournaments SET room_id=$1, room_password=$2, status=$3 WHERE id=$4',
      [room_id, room_password, 'registering', req.params.id]
    );
    res.json({ success: true, message: 'Room credentials set' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

adminRouter.get('/results/pending', adminAuth, async (req, res) => {
  try {
    const results = await query(`
      SELECT r.*, u.username, u.ff_username, t.title as tournament_title, t.mode
      FROM tournament_results r
      JOIN users u ON r.user_id = u.id
      JOIN tournaments t ON r.tournament_id = t.id
      WHERE r.status = 'pending'
      ORDER BY r.submitted_at ASC
    `);
    res.json({ success: true, data: { results: results.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

adminRouter.patch('/result/:id/verify', adminAuth, async (req, res) => {
  try {
    const { action, kills, rank } = req.body; // action: approve | reject

    const result = await queryOne('SELECT * FROM tournament_results WHERE id=$1', [req.params.id]);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    if (action === 'approve') {
      await query(
        'UPDATE tournament_results SET status=$1, verified_at=NOW(), rank=$2, kills=$3 WHERE id=$4',
        ['verified', rank || result.rank, kills || result.kills, req.params.id]
      );
      if (!result.prize_credited) {
        await creditPrize(result.tournament_id, result.user_id, rank||result.rank, kills||result.kills, result.id);
      }
    } else {
      await query(
        'UPDATE tournament_results SET status=$1, rejection_reason=$2 WHERE id=$3',
        ['rejected', req.body.reason, req.params.id]
      );
    }

    res.json({ success: true, message: `Result ${action}d` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

adminRouter.patch('/user/:id/ban', adminAuth, async (req, res) => {
  try {
    const { reason, permanent, days } = req.body;
    const banUntil = permanent ? null : new Date(Date.now() + days * 86400 * 1000);
    await query(
      'UPDATE users SET is_banned=TRUE, ban_reason=$1, ban_until=$2 WHERE id=$3',
      [reason, banUntil, req.params.id]
    );
    res.json({ success: true, message: 'User banned' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

module.exports = adminRouter;
