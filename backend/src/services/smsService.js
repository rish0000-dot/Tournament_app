// ============================================
// services/smsService.js
// ============================================
const axios = require('axios');
const logger = require('../utils/logger');

const sendSMS = async (phone, message) => {
  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        message,
        language: 'english',
        route: 'q',
        numbers: phone,
      }
    });
    logger.info(`SMS sent to ${phone}`);
    return response.data;
  } catch (error) {
    logger.error('SMS error:', error);
    throw error;
  }
};

module.exports = { sendSMS };
