const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Giới hạn rate cho API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests/IP
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  }
});

// Giới hạn rate cho authentication
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // Giới hạn 10 requests/IP
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again later'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};