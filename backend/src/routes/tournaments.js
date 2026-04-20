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

module.exports = router;
