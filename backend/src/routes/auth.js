// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const Joi = require('joi');

const sendOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({ 'string.pattern.base': 'Invalid Indian phone number' })
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).required(),
  fcm_token: Joi.string().optional(),
  device_id: Joi.string().optional()
});

const setupProfileSchema = Joi.object({
  username: Joi.string().min(3).max(20).alphanum().required(),
  ff_uid: Joi.string().required(),
  ff_username: Joi.string().required(),
  referral_code: Joi.string().optional()
});

// POST /api/auth/send-otp
router.post('/send-otp', validateBody(sendOtpSchema), authController.sendOTP);

// POST /api/auth/verify-otp
router.post('/verify-otp', validateBody(verifyOtpSchema), authController.verifyOTP);

// POST /api/auth/setup-profile (after first login)
router.post('/setup-profile', require('../middleware/auth'), validateBody(setupProfileSchema), authController.setupProfile);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', require('../middleware/auth'), authController.logout);

module.exports = router;
