// config/redis.js
const { createClient } = require('redis');
const logger = require('../utils/logger');

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => logger.error('Redis Error:', err));

const connectRedis = async () => {
  await client.connect();
  logger.info('✅ Redis connected');
};

// OTP helpers
const setOTP = async (phone, otp) => {
  await client.setEx(`otp:${phone}`, 600, otp); // 10 min
};
const getOTP = async (phone) => client.get(`otp:${phone}`);
const deleteOTP = async (phone) => client.del(`otp:${phone}`);

// Session helpers
const setSession = async (userId, data) => {
  await client.setEx(`session:${userId}`, 86400 * 30, JSON.stringify(data));
};
const getSession = async (userId) => {
  const data = await client.get(`session:${userId}`);
  return data ? JSON.parse(data) : null;
};
const deleteSession = async (userId) => client.del(`session:${userId}`);

// Tournament live data cache
const cacheTournament = async (tournamentId, data) => {
  await client.setEx(`tournament:${tournamentId}`, 300, JSON.stringify(data));
};
const getCachedTournament = async (tournamentId) => {
  const data = await client.get(`tournament:${tournamentId}`);
  return data ? JSON.parse(data) : null;
};
const invalidateTournament = async (tournamentId) => {
  client.del(`tournament:${tournamentId}`);
};

// Daily login tracking
const setDailyLogin = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  await client.setEx(`login:${userId}:${today}`, 86400, '1');
};
const hasDailyLogin = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  return await client.get(`login:${userId}:${today}`);
};

// Ad watch tracking (max 5/day)
const incrementAdWatch = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const key = `ads:${userId}:${today}`;
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, 86400);
  return count;
};
const getAdWatchCount = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  return parseInt(await client.get(`ads:${userId}:${today}`) || '0');
};

module.exports = {
  connectRedis, client,
  setOTP, getOTP, deleteOTP,
  setSession, getSession, deleteSession,
  cacheTournament, getCachedTournament, invalidateTournament,
  setDailyLogin, hasDailyLogin,
  incrementAdWatch, getAdWatchCount
};
