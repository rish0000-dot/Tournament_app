// controllers/walletController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { query, queryOne, withTransaction } = require('../config/database');
const { sendPushNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================
// GET WALLET BALANCE
// ============================================
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await queryOne('SELECT * FROM wallets WHERE user_id=$1', [userId]);
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    // Recent transactions
    const transactions = await query(
      `SELECT * FROM transactions WHERE user_id=$1
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    // Coin transactions
    const coinTx = await query(
      `SELECT * FROM coin_transactions WHERE user_id=$1
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        wallet: {
          real_cash: parseFloat(wallet.real_cash),
          bonus_cash: parseFloat(wallet.bonus_cash),
          blazegold: wallet.blazegold,
          blazegold_in_rupees: (wallet.blazegold / 100).toFixed(2),
          total_deposited: parseFloat(wallet.total_deposited),
          total_withdrawn: parseFloat(wallet.total_withdrawn),
          total_won: parseFloat(wallet.total_won),
        },
        recent_transactions: transactions.rows,
        coin_transactions: coinTx.rows
      }
    });
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
};

// ============================================
// INITIATE DEPOSIT (Create Razorpay Order)
// ============================================
exports.initiateDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is ₹10' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id=$1', [userId]);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `dep_${userId}_${Date.now()}`,
      notes: { user_id: userId, type: 'deposit' }
    });

    // Create pending transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, status, razorpay_order_id, description)
       VALUES ($1, 'deposit', $2, 'pending', $3, $4)`,
      [userId, amount, order.id, `Wallet deposit ₹${amount}`]
    );

    // Check if first deposit (for bonus)
    const wallet = await queryOne('SELECT total_deposited FROM wallets WHERE user_id=$1', [userId]);
    const isFirstDeposit = parseFloat(wallet.total_deposited) === 0;

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: 'INR',
        razorpay_key: process.env.RAZORPAY_KEY_ID,
        user: {
          name: user.username || 'Player',
          phone: user.phone
        },
        first_deposit_bonus: isFirstDeposit ? Math.min(amount * 0.5, 100) : 0,
        is_first_deposit: isFirstDeposit
      }
    });
  } catch (error) {
    logger.error('Initiate deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate deposit' });
  }
};

// ============================================
// CONFIRM DEPOSIT (After Razorpay success)
// ============================================
exports.confirmDeposit = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Get pending transaction
    const transaction = await queryOne(
      `SELECT * FROM transactions
       WHERE user_id=$1 AND razorpay_order_id=$2 AND status='pending'`,
      [userId, razorpay_order_id]
    );

    if (!transaction) {
      return res.status(400).json({ success: false, message: 'Transaction not found' });
    }

    const amount = parseFloat(transaction.amount);

    await withTransaction(async (client) => {
      // Update transaction
      await client.query(
        `UPDATE transactions
         SET status='completed', razorpay_payment_id=$1, updated_at=NOW()
         WHERE id=$2`,
        [razorpay_payment_id, transaction.id]
      );

      // Credit wallet
      const wallet = await client.query(
        `UPDATE wallets
         SET real_cash=real_cash+$1, total_deposited=total_deposited+$1, updated_at=NOW()
         WHERE user_id=$2 RETURNING *`,
        [amount, userId]
      );

      // First deposit bonus
      const totalDeposited = parseFloat(wallet.rows[0].total_deposited);
      const wasFirstDeposit = totalDeposited === amount;

      if (wasFirstDeposit) {
        const bonusAmount = Math.min(amount * 0.5, 100);
        await client.query(
          'UPDATE wallets SET bonus_cash=bonus_cash+$1 WHERE user_id=$2',
          [bonusAmount, userId]
        );
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, description)
           VALUES ($1, 'bonus', $2, 'completed', 'First deposit bonus (50%)')`,
          [userId, bonusAmount]
        );
      }
    });

    const updatedWallet = await queryOne('SELECT * FROM wallets WHERE user_id=$1', [userId]);

    await sendPushNotification(userId, {
      title: '💰 Money Added!',
      body: `₹${amount} added to your wallet. Happy gaming!`,
      data: { type: 'deposit_success' }
    });

    res.json({
      success: true,
      message: `₹${amount} added successfully!`,
      data: {
        new_balance: parseFloat(updatedWallet.real_cash),
        bonus_cash: parseFloat(updatedWallet.bonus_cash)
      }
    });
  } catch (error) {
    logger.error('Confirm deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm deposit' });
  }
};

// ============================================
// INITIATE WITHDRAWAL
// ============================================
exports.initiateWithdrawal = async (req, res) => {
  try {
    const { amount, method, upi_id, bank_account, ifsc_code } = req.body;
    const userId = req.user.id;
    const MIN_WITHDRAWAL = parseFloat(process.env.MIN_WITHDRAWAL) || 10;

    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}` });
    }

    const wallet = await queryOne('SELECT * FROM wallets WHERE user_id=$1 FOR UPDATE', [userId]);
    if (parseFloat(wallet.real_cash) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // KYC check for large withdrawals
    const user = await queryOne('SELECT * FROM users WHERE id=$1', [userId]);
    if (amount > 1000 && !user.is_kyc_verified) {
      return res.status(400).json({
        success: false,
        message: 'KYC verification required for withdrawals above ₹1000'
      });
    }

    // Daily limit check
    const todayWithdrawals = await queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id=$1 AND type='withdrawal'
      AND created_at >= CURRENT_DATE AND status != 'failed'
    `, [userId]);

    const dailyTotal = parseFloat(todayWithdrawals.total) + amount;
    if (dailyTotal > 100000) {
      return res.status(400).json({ success: false, message: 'Daily withdrawal limit exceeded' });
    }

    await withTransaction(async (client) => {
      // Deduct from wallet immediately
      await client.query(
        'UPDATE wallets SET real_cash=real_cash-$1, total_withdrawn=total_withdrawn+$1 WHERE user_id=$2',
        [amount, userId]
      );

      // Create withdrawal transaction
      await client.query(
        `INSERT INTO transactions
         (user_id, type, amount, status, payment_method, upi_id, bank_account, ifsc_code, description)
         VALUES ($1, 'withdrawal', $2, 'pending', $3, $4, $5, $6, $7)`,
        [userId, amount, method, upi_id || null, bank_account || null, ifsc_code || null,
         `Withdrawal ₹${amount} via ${method}`]
      );
    });

    // Process payout (UPI instant, bank 24hr)
    if (method === 'upi') {
      // Trigger instant UPI payout via Razorpay
      processUPIPayout(userId, amount, upi_id).catch(logger.error);
    }

    res.json({
      success: true,
      message: method === 'upi'
        ? 'Withdrawal initiated! Will be credited in minutes.'
        : 'Withdrawal request submitted. Will be processed within 24 hours.',
      data: { amount, method, estimated_time: method === 'upi' ? 'Instant' : '24 hours' }
    });
  } catch (error) {
    logger.error('Withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Withdrawal failed' });
  }
};

// Process UPI payout via Razorpay
const processUPIPayout = async (userId, amount, upiId) => {
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account: {
        account_type: 'vpa',
        vpa: { address: upiId }
      },
      amount: Math.round(amount * 100),
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      narration: 'BlazeStrike Withdrawal'
    });

    // Update transaction status
    await query(
      `UPDATE transactions SET status='completed', updated_at=NOW()
       WHERE user_id=$1 AND type='withdrawal' AND status='pending'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    await sendPushNotification(userId, {
      title: '✅ Withdrawal Successful!',
      body: `₹${amount} sent to your UPI account.`,
      data: { type: 'withdrawal_success' }
    });
  } catch (error) {
    // Refund on failure
    await query(
      'UPDATE wallets SET real_cash=real_cash+$1 WHERE user_id=$2',
      [amount, userId]
    );
    await query(
      `UPDATE transactions SET status='failed', updated_at=NOW()
       WHERE user_id=$1 AND type='withdrawal' AND status='pending'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    logger.error('UPI payout failed, refunded:', error);
  }
};

// ============================================
// REDEEM BLAZEGOLD TO CASH
// ============================================
exports.redeemCoins = async (req, res) => {
  try {
    const { coins } = req.body;
    const userId = req.user.id;
    const MIN_REDEEM = 500; // 500 coins = ₹5
    const RATE = 100; // 100 coins = ₹1

    if (coins < MIN_REDEEM) {
      return res.status(400).json({
        success: false,
        message: `Minimum redemption is ${MIN_REDEEM} BlazeGold (= ₹${MIN_REDEEM / RATE})`
      });
    }

    const wallet = await queryOne('SELECT blazegold FROM wallets WHERE user_id=$1', [userId]);
    if (wallet.blazegold < coins) {
      return res.status(400).json({ success: false, message: 'Insufficient BlazeGold' });
    }

    const cashAmount = coins / RATE;

    await withTransaction(async (client) => {
      await client.query(
        'UPDATE wallets SET blazegold=blazegold-$1, real_cash=real_cash+$2 WHERE user_id=$3',
        [coins, cashAmount, userId]
      );
      await client.query(
        `INSERT INTO coin_transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'redeem', $3)`,
        [userId, -coins, `Redeemed ${coins} BlazeGold = ₹${cashAmount}`]
      );
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, status, description)
         VALUES ($1, 'coin_redeem', $2, 'completed', $3)`,
        [userId, cashAmount, `Redeemed ${coins} BlazeGold`]
      );
    });

    res.json({
      success: true,
      message: `🎉 ${coins} BlazeGold redeemed! ₹${cashAmount} added to your wallet.`,
      data: { coins_redeemed: coins, cash_credited: cashAmount }
    });
  } catch (error) {
    logger.error('Redeem coins error:', error);
    res.status(500).json({ success: false, message: 'Redemption failed' });
  }
};
