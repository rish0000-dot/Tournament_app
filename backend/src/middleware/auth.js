// middleware/auth.js
const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne(
      'SELECT * FROM users WHERE id=$1 AND is_banned=FALSE',
      [decoded.userId]
    );

    if (!user) return res.status(401).json({ success: false, message: 'User not found or banned' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
