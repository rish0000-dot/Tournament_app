const express = require('express');
const walletRouter = express.Router();
const walletCtrl = require('../controllers/walletController');
const auth = require('../middleware/auth');

walletRouter.get('/', auth, walletCtrl.getWallet);
walletRouter.post('/deposit/initiate', auth, walletCtrl.initiateDeposit);
walletRouter.post('/deposit/confirm', auth, walletCtrl.confirmDeposit);
walletRouter.post('/withdraw', auth, walletCtrl.initiateWithdrawal);
walletRouter.post('/redeem-coins', auth, walletCtrl.redeemCoins);

module.exports = walletRouter;
