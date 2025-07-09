const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Authenticated routes
router.get('/me', authController.authenticate, authController.getMe);
router.put('/me', authController.authenticate, authController.updateProfile);

module.exports = router;