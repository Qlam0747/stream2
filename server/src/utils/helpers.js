const crypto = require('crypto');
const logger = require('./logger');

// Generate random stream key
exports.generateStreamKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Validate stream key format
exports.validateStreamKey = (key) => {
  return /^[a-f0-9]{32}$/.test(key);
};

// Error handler for async/await
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Async handler error', { error: error.message });
    next(error);
  });
};

// Format error response
exports.formatError = (error) => {
  return {
    success: false,
    error: error.message || 'An error occurred'
  };
};

// Multer configuration for file uploads
exports.multerConfig = {
  storage: require('multer').memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
};