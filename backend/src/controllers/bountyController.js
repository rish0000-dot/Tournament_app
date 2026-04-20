const { query, queryOne, withTransaction } = require('../config/database');
const ocrService = require('../services/ocrService');

/**
 * Get current live bounty for a specific player
 */
exports.getPlayerBounty = async (req, res) => {
  try {
    const { userId } = req.params;
    const bounty = await queryOne(
      'SELECT current_bounty, total_bounties_claimed, reputation_score FROM users WHERE id = $1',
      [userId]
    );
    if (!bounty) return res.status(404).json({ success: false, message: 'Player not found' });
    res.json({ success: true, data: bounty });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching bounty data' });
  }
};

/**
 * Get the "Most Wanted" players (highest bounties)
 */
exports.getMostWanted = async (req, res) => {
  try {
    const players = await query(
      `SELECT id, username, avatar_url, ff_username, current_bounty
       FROM users
       WHERE current_bounty > 0
       ORDER BY current_bounty DESC
       LIMIT 10`
    );
    res.json({ success: true, data: players.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch most wanted list' });
  }
};

/**
 * Claim a bounty on a player
 * Requires proof (screenshot) and match verification
 */
exports.claimBounty = async (req, res) => {
  try {
    const { targetUserId, matchId } = req.body;
    const hunterId = req.user.id;
    const screenshot = req.file; // Assuming multer middleware is used

    if (!screenshot) {
      return res.status(400).json({ success: false, message: 'Screenshot proof is required' });
    }

    if (hunterId === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot claim a bounty on yourself' });
    }

    // Check if target has a bounty
    const target = await queryOne('SELECT current_bounty FROM users WHERE id = $1', [targetUserId]);
    if (!target || target.current_bounty <= 0) {
      return res.status(400).json({ success: false, message: 'No active bounty on this player' });
    }

    // 1. Verify Kill via OCR
    const ocrResult = await ocrService.extractMatchResult(screenshot.path);
    const killVerified = ocrResult.kills.some(k => k.victim === targetUserId || k.victim_ff_id === target.ff_id);

    if (!killVerified) {
      return res.status(400).json({ success: false, message: 'Kill could not be verified from the screenshot' });
    }

    // 2. Process Reward
    const reward = target.current_bounty;
    await withTransaction(async (client) => {
      // Record bounty claim
      await client.query(
        `INSERT INTO bounty_claims (hunter_id, target_id, match_id, amount, proof_url, status)
         VALUES ($1, $2, $3, $4, $5, 'verified')`,
        [hunterId, targetUserId, matchId, reward, screenshot.path]
      );

      // Reset target bounty
      await client.query('UPDATE users SET current_bounty = 10 WHERE id = $1', [targetUserId]); // Reset to minimum ₹10

      // Add to hunter wallet (as BlazeGold/Cash per PRD logic)
      await client.query(
        'UPDATE users SET cash_balance = cash_balance + $1, total_bounties_claimed = total_bounties_claimed + 1 WHERE id = $2',
        [reward, hunterId]
      );
    });

    res.json({
      success: true,
      message: `Bounty of ₹${reward} successfully claimed!`,
      data: { reward }
    });
  } catch (err) {
    console.error('Bounty Claim error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while claiming bounty' });
  }
};

/**
 * Internal: Scale bounty after a match (Win + ₹5, Kill + ₹2)
 */
exports.updateBountiesAfterMatch = async (matchData) => {
  // Logic to iterate through participants and increment their current_bounty
  // This is typically called by the match verification worker
};
