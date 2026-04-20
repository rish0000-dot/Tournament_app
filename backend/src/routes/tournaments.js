const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tournamentController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', ctrl.getTournaments);
router.get('/my', auth, ctrl.getMyTournaments);
router.get('/:id', auth, ctrl.getTournamentById);
router.post('/:id/join', auth, ctrl.joinTournament);
router.post('/:id/result', auth, upload.single('screenshot'), ctrl.submitResult);

// Last Bullet 1v1 Challenge endpoints
router.post('/last-bullet/:challengeId/accept', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    const { queryOne, query } = require('../config/database');

    const challenge = await queryOne(
      'SELECT * FROM last_bullet_challenges WHERE id=$1 AND status=$2',
      [challengeId, 'pending']
    );
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found or expired' });

    // Check this user is one of the two players
    const isPlayer1 = challenge.player1_id === userId;
    const isPlayer2 = challenge.player2_id === userId;
    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ success: false, message: 'Not your challenge' });
    }

    // Update acceptance
    const acceptField = isPlayer1 ? 'player1_accepted' : 'player2_accepted';
    await query(`UPDATE last_bullet_challenges SET ${acceptField}=TRUE WHERE id=$1`, [challengeId]);

    // Reload to check if both accepted
    const updated = await queryOne('SELECT * FROM last_bullet_challenges WHERE id=$1', [challengeId]);

    if (updated.player1_accepted && updated.player2_accepted) {
      // Both accepted → generate room
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const roomPass = Math.floor(1000 + Math.random() * 9000).toString();
      await query(
        `UPDATE last_bullet_challenges SET status='active', room_id=$1, room_password=$2 WHERE id=$3`,
        [roomId, roomPass, challengeId]
      );
      return res.json({
        success: true, message: 'Both players accepted! Room created.',
        data: { room_id: roomId, room_password: roomPass }
      });
    }

    res.json({ success: true, message: 'Challenge accepted! Waiting for opponent...' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to accept challenge' });
  }
});

router.post('/last-bullet/:challengeId/decline', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { query } = require('../config/database');
    await query('UPDATE last_bullet_challenges SET status=$1 WHERE id=$2', ['expired', challengeId]);
    res.json({ success: true, message: 'Challenge declined.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

module.exports = router;
