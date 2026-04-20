// ============================================
// services/notificationService.js
// ============================================
const admin = require('firebase-admin');
const { queryOne } = require('../config/database');
const logger = require('../utils/logger');

let firebaseInitialized = false;

const initFirebase = () => {
  if (!firebaseInitialized && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
    firebaseInitialized = true;
  }
};

const sendPushNotification = async (userId, { title, body, data = {} }) => {
  try {
    initFirebase();
    const user = await queryOne('SELECT fcm_token FROM users WHERE id=$1', [userId]);
    if (!user?.fcm_token) return;

    await admin.messaging().send({
      token: user.fcm_token,
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      android: { priority: 'high', notification: { sound: 'default', channel_id: 'blazestrike' } },
    });

    // Save to DB
    const { query } = require('../config/database');
    await query(
      `INSERT INTO notifications (user_id, title, body, type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, body, data.type || 'system', JSON.stringify(data)]
    );
  } catch (error) {
    logger.error('Push notification error:', error.message);
  }
};

const sendBulkNotification = async (userIds, payload) => {
  await Promise.allSettled(userIds.map(id => sendPushNotification(id, payload)));
};

module.exports = { sendPushNotification, sendBulkNotification };
