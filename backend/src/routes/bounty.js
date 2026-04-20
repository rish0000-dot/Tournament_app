// routes/bounty.js
const express = require('express');
const bountyRouter = express.Router();
const auth = require('../middleware/auth');
const bountyCtrl = require('../controllers/bountyController');

// Get most wanted bounties (public)
bountyRouter.get('/most-wanted', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const bounties = await query(`
      SELECT b.*, u.username, u.avatar_url, u.ff_username, u.total_wins
      FROM bounties b
      JOIN users u ON b.target_user_id = u.id
      WHERE b.is_active = TRUE AND b.amount > 0
      ORDER BY b.amount DESC
      LIMIT 20
    `);
    res.json({ success: true, data: { bounties: bounties.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bounties' });
  }
});

// Claim a bounty
bountyRouter.post('/claim', auth, async (req, res) => {
  try {
    const { target_username, tournament_id } = req.body;
    const { queryOne, withTransaction } = require('../config/database');

    const target = await queryOne('SELECT id FROM users WHERE username=$1', [target_username]);
    if (!target) return res.status(404).json({ success: false, message: 'Player not found' });
    if (target.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot claim your own bounty' });
    }

    const bounty = await queryOne(
      'SELECT * FROM bounties WHERE target_user_id=$1 AND is_active=TRUE',
      [target.id]
    );
    if (!bounty || bounty.amount <= 0) {
      return res.status(404).json({ success: false, message: 'No active bounty on this player' });
    }

    // Claim 20% of bounty (max ₹100)
    const claimAmount = Math.min(bounty.amount * 0.2, 100);

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO bounty_claims (bounty_id, claimer_id, target_id, tournament_id, amount_claimed, status)
         VALUES ($1,$2,$3,$4,$5,'pending')`,
        [bounty.id, req.user.id, target.id, tournament_id, claimAmount]
      );
      await client.query(
        'UPDATE bounties SET amount=amount-$1, last_claimed_at=NOW() WHERE id=$2',
        [claimAmount, bounty.id]
      );
    });

    res.json({
      success: true,
      message: `Bounty claim submitted! ₹${claimAmount.toFixed(2)} pending verification.`,
      data: { claim_amount: claimAmount }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to claim bounty' });
  }
});

module.exports = bountyRouter;
