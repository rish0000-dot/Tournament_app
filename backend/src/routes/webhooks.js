const express = require('express');
const webhookRouter = express.Router();
const crypto = require('crypto');
const { query } = require('../config/database');

webhookRouter.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body.toString();
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(body);
    if (event.event === 'payout.processed') {
      const payoutId = event.payload.payout.entity.id;
      await query(
        `UPDATE transactions SET status='completed', updated_at=NOW()
         WHERE type='withdrawal' AND status='pending'
         ORDER BY created_at DESC LIMIT 1`
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = webhookRouter;
