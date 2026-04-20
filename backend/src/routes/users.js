const express = require('express');
const userRouter = express.Router();
const multer = require('multer');
const multerUser = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { uploadToS3 } = require('../services/storageService');
const auth = require('../middleware/auth');

// Get profile
userRouter.get('/me', auth, async (req, res) => {
  try {
    const { queryOne, query } = require('../config/database');
    const user = await queryOne('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const wallet = await queryOne('SELECT * FROM wallets WHERE user_id=$1', [req.user.id]);
    const clan = await queryOne(`
      SELECT c.* FROM clans c
      JOIN clan_members cm ON c.id = cm.clan_id
      WHERE cm.user_id = $1
    `, [req.user.id]);

    res.json({ success: true, data: { user, wallet, clan } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Update profile
userRouter.patch('/me', auth, async (req, res) => {
  try {
    const { language, ff_uid, ff_username } = req.body;
    const { query } = require('../config/database');
    await query(
      'UPDATE users SET language=$1, ff_uid=$2, ff_username=$3, updated_at=NOW() WHERE id=$4',
      [language, ff_uid, ff_username, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// Upload avatar
userRouter.post('/avatar', auth, multerUser.single('avatar'), async (req, res) => {
  try {
    const url = await uploadToS3(req.file, `avatars/${req.user.id}`);
    const { query } = require('../config/database');
    await query('UPDATE users SET avatar_url=$1 WHERE id=$2', [url, req.user.id]);
    res.json({ success: true, data: { avatar_url: url } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Avatar upload failed' });
  }
});

// Submit KYC
userRouter.post('/kyc', auth, multerUser.fields([
  { name: 'aadhaar_front' }, { name: 'aadhaar_back' }, { name: 'pan' }
]), async (req, res) => {
  try {
    const { aadhaar_number, pan_number } = req.body;
    const aadhaarFront = await uploadToS3(req.files.aadhaar_front[0], `kyc/${req.user.id}/aadhaar_front`);
    const aadhaarBack = await uploadToS3(req.files.aadhaar_back[0], `kyc/${req.user.id}/aadhaar_back`);
    const pan = await uploadToS3(req.files.pan[0], `kyc/${req.user.id}/pan`);

    const { query } = require('../config/database');
    await query(
      `INSERT INTO kyc_documents (user_id, aadhaar_front_url, aadhaar_back_url, pan_url, aadhaar_number, pan_number)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id) DO UPDATE SET
       aadhaar_front_url=$2, aadhaar_back_url=$3, pan_url=$4, status='pending'`,
      [req.user.id, aadhaarFront, aadhaarBack, pan, aadhaar_number, pan_number]
    );
    res.json({ success: true, message: 'KYC submitted! Verification within 24 hours.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'KYC submission failed' });
  }
});

// Get leaderboard
userRouter.get('/leaderboard', async (req, res) => {
  try {
    const { period = 'monthly', mode } = req.query;
    const { query } = require('../config/database');

    const dateFilter = period === 'daily' ? 'CURRENT_DATE'
      : period === 'weekly' ? "NOW() - INTERVAL '7 days'"
      : "NOW() - INTERVAL '30 days'";

    const leaderboard = await query(`
      SELECT u.id, u.username, u.avatar_url, u.ff_username,
        COUNT(tr.id) as matches,
        SUM(res.kills) as total_kills,
        SUM(CASE WHEN res.rank=1 THEN 1 ELSE 0 END) as wins,
        SUM(res.prize_amount) as total_earnings
      FROM users u
      JOIN tournament_results res ON u.id = res.user_id
      JOIN tournament_registrations tr ON tr.user_id=u.id AND tr.tournament_id=res.tournament_id
      WHERE res.submitted_at >= ${dateFilter}
      GROUP BY u.id
      ORDER BY total_earnings DESC, total_kills DESC
      LIMIT 50
    `);

    res.json({ success: true, data: { leaderboard: leaderboard.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

// Get notifications
userRouter.get('/notifications', auth, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const notifs = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY sent_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json({ success: true, data: { notifications: notifs.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

module.exports = userRouter;
