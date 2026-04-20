// controllers/authController.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, withTransaction } = require('../config/database');
const { setOTP, getOTP, deleteOTP, setDailyLogin, hasDailyLogin } = require('../config/redis');
const { sendSMS } = require('../services/smsService');
const { awardCoins } = require('../services/coinService');
const { sendPushNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Generate referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ============================================
// SEND OTP
// ============================================
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = process.env.NODE_ENV === 'development' ? '123456' : generateOTP();

    // Store in Redis (10 min expiry)
    await setOTP(phone, otp);

    // Send SMS in production
    if (process.env.NODE_ENV !== 'development') {
      await sendSMS(phone, `Your BlazeStrike OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`);
    } else {
      logger.info(`DEV OTP for ${phone}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Only in dev
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// ============================================
// VERIFY OTP & LOGIN/REGISTER
// ============================================
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, fcm_token, device_id } = req.body;

    // Check OTP
    const storedOTP = await getOTP(phone);
    if (!storedOTP) {
      return res.status(400).json({ success: false, message: 'OTP expired. Request new OTP.' });
    }
    if (storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Delete used OTP
    await deleteOTP(phone);

    // Check if user exists
    let user = await queryOne('SELECT * FROM users WHERE phone = $1', [phone]);
    let isNewUser = false;

    if (!user) {
      // Register new user
      isNewUser = true;
      const referralCode = generateReferralCode();

      user = await queryOne(
        `INSERT INTO users (phone, referral_code, is_verified)
         VALUES ($1, $2, TRUE) RETURNING *`,
        [phone, referralCode]
      );

      // Create wallet for new user
      await query(
        'INSERT INTO wallets (user_id) VALUES ($1)',
        [user.id]
      );
    }

    // Update FCM token
    if (fcm_token) {
      await query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcm_token, user.id]);
    }

    // Daily login coin reward
    const alreadyLoggedIn = await hasDailyLogin(user.id);
    if (!alreadyLoggedIn && !isNewUser) {
      await setDailyLogin(user.id);
      await awardCoins(user.id, 10, 'daily_login', null, 'Daily login bonus');
    } else if (!alreadyLoggedIn && isNewUser) {
      await setDailyLogin(user.id);
    }

    // Generate JWT
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          username: user.username,
          ff_uid: user.ff_uid,
          ff_username: user.ff_username,
          avatar_url: user.avatar_url,
          referral_code: user.referral_code,
          is_kyc_verified: user.is_kyc_verified,
          language: user.language
        },
        isNewUser,
        needsProfileSetup: !user.username
      }
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ============================================
// SETUP PROFILE (After first login)
// ============================================
exports.setupProfile = async (req, res) => {
  try {
    const { username, ff_uid, ff_username, referral_code } = req.body;
    const userId = req.user.id;

    // Check username uniqueness
    const existingUsername = await queryOne(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Check FF UID uniqueness
    const existingUID = await queryOne(
      'SELECT id FROM users WHERE ff_uid = $1 AND id != $2',
      [ff_uid, userId]
    );
    if (existingUID) {
      return res.status(400).json({ success: false, message: 'Free Fire UID already linked to another account' });
    }

    await withTransaction(async (client) => {
      // Update profile
      await client.query(
        `UPDATE users SET username=$1, ff_uid=$2, ff_username=$3, updated_at=NOW()
         WHERE id=$4`,
        [username, ff_uid, ff_username, userId]
      );

      // Handle referral
      if (referral_code) {
        const referrer = await queryOne(
          'SELECT id FROM users WHERE referral_code = $1',
          [referral_code]
        );
        if (referrer && referrer.id !== userId) {
          await client.query(
            'UPDATE users SET referred_by = $1 WHERE id = $2',
            [referrer.id, userId]
          );
          // Give referral coins to referrer
          await awardCoins(referrer.id, 200, 'referral', null, `Referral bonus: ${username} joined`);
          // Give welcome coins to new user
          await awardCoins(userId, 100, 'referral', null, 'Welcome bonus for using referral code');
        }
      }

      // Welcome bonus coins
      await awardCoins(userId, 50, 'bonus', null, 'Welcome to BlazeStrike!');
    });

    const updatedUser = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Profile setup complete! Welcome to BlazeStrike!',
      data: { user: updatedUser }
    });
  } catch (error) {
    logger.error('Setup profile error:', error);
    res.status(500).json({ success: false, message: 'Profile setup failed' });
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    const user = await queryOne('SELECT id FROM users WHERE id = $1 AND is_banned = FALSE', [decoded.userId]);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const newToken = generateToken(user.id);
    res.json({ success: true, data: { token: newToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ============================================
// LOGOUT
// ============================================
exports.logout = async (req, res) => {
  try {
    // Clear FCM token
    await query('UPDATE users SET fcm_token = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
