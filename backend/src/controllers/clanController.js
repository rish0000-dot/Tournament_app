const { query, queryOne, withTransaction } = require('../config/database');

/**
 * Create a new clan
 */
exports.createClan = async (req, res) => {
  try {
    const { name, tag, description, emblem } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!name || !tag || tag.length > 5) {
      return res.status(400).json({ success: false, message: 'Invalid name or tag (max 5 chars)' });
    }

    const existing = await queryOne('SELECT id FROM clans WHERE name = $1 OR tag = $2', [name, tag]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Clan name or tag already taken' });
    }

    const result = await withTransaction(async (client) => {
      // 1. Create the clan
      const clanRes = await client.query(
        `INSERT INTO clans (name, tag, description, emblem, captain_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, tag, description, emblem, userId]
      );
      const clan = clanRes.rows[0];

      // 2. Add captain as the first member
      await client.query(
        `INSERT INTO clan_members (clan_id, user_id, role)
         VALUES ($1, $2, 'captain')`,
        [clan.id, userId]
      );

      return clan;
    });

    res.status(201).json({
      success: true,
      message: 'Clan created successfully!',
      data: result
    });
  } catch (err) {
    console.error('Create Clan Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Join an existing clan
 */
exports.joinClan = async (req, res) => {
  try {
    const { clanId } = req.params;
    const userId = req.user.id;

    // Check if user is already in a clan
    const alreadyInMember = await queryOne('SELECT id FROM clan_members WHERE user_id = $1', [userId]);
    if (alreadyInMember) {
      return res.status(400).json({ success: false, message: 'You are already in a clan' });
    }

    const clan = await queryOne('SELECT * FROM clans WHERE id = $1', [clanId]);
    if (!clan) {
      return res.status(404).json({ success: false, message: 'Clan not found' });
    }

    if (clan.total_members >= clan.max_members) {
      return res.status(400).json({ success: false, message: 'Clan is full' });
    }

    if (!clan.is_open) {
      return res.status(400).json({ success: false, message: 'This clan is not accepting new members' });
    }

    await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO clan_members (clan_id, user_id) VALUES ($1, $2)',
        [clanId, userId]
      );
      await client.query(
        'UPDATE clans SET total_members = total_members + 1 WHERE id = $1',
        [clanId]
      );
    });

    res.json({ success: true, message: `Successfully joined ${clan.name}!` });
  } catch (err) {
    console.error('Join Clan Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get clan leaderboard based on season points
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const clans = await query(
      'SELECT id, name, tag, emblem, total_members, season_points, total_wins FROM clans ORDER BY season_points DESC LIMIT 50'
    );
    res.json({ success: true, data: clans.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

/**
 * Get details of a specific clan including members
 */
exports.getClanDetails = async (req, res) => {
  try {
    const { clanId } = req.params;

    const clan = await queryOne('SELECT * FROM clans WHERE id = $1', [clanId]);
    if (!clan) return res.status(404).json({ success: false, message: 'Clan not found' });

    const members = await query(
      `SELECT cm.id, cm.role, cm.season_points, cm.contribution_coins, u.username, u.avatar_url, u.ff_username
       FROM clan_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.clan_id = $1
       ORDER BY cm.role DESC, cm.season_points DESC`,
      [clanId]
    );

    res.json({
      success: true,
      data: {
        ...clan,
        members: members.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch clan details' });
  }
};

/**
 * Update clan treasury from tournament winnings (usually internal service call)
 */
exports.updateTreasury = async (clanId, amountCash, amountCoins) => {
  try {
    await query(
      'UPDATE clans SET treasury_cash = treasury_cash + $1, treasury_coins = treasury_coins + $2 WHERE id = $3',
      [amountCash, amountCoins, clanId]
    );
    return true;
  } catch (err) {
    console.error('Treasury Update Error:', err);
    return false;
  }
};
