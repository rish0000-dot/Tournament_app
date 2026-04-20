// config/database.js
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info('✅ PostgreSQL connected');
    client.release();
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed:', err);
    throw err;
  }
};

// Helper: run query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) logger.warn(`Slow query (${duration}ms): ${text}`);
    return res;
  } catch (err) {
    logger.error('DB Query Error:', { text, params, err: err.message });
    throw err;
  }
};

// Helper: get single row
const queryOne = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

// Helper: transaction
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { connectDB, query, queryOne, withTransaction, pool };
