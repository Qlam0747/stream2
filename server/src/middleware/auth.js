const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = {
  // Xác thực JWT
  authenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isBanned) {
        throw new Error('User account is banned');
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      logger.error('Authentication failed', { error: error.message });
      res.status(401).json({ 
        success: false, 
        error: 'Please authenticate' 
      });
    }
  },

  // Kiểm tra quyền admin
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    logger.warn('Unauthorized admin access attempt', { userId: req.user?._id });
    res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  },

  // Kiểm tra quyền streamer
  isStreamer: (req, res, next) => {
    if (req.user && (req.user.role === 'streamer' || req.user.role === 'admin')) {
      return next();
    }
    logger.warn('Unauthorized streamer access attempt', { userId: req.user?._id });
    res.status(403).json({ 
      success: false, 
      error: 'Streamer access required' 
    });
  }
};