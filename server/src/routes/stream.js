const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const { authenticate, isStreamer } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', apiLimiter, streamController.listStreams);
router.get('/:streamId', apiLimiter, streamController.getStream);
router.get('/key/:streamKey', apiLimiter, streamController.getStreamByKey);
router.get('/verify/:streamKey', apiLimiter, streamController.verifyStreamKey);

// Authenticated routes
router.post('/', authenticate, isStreamer, streamController.startStream);
router.put('/:streamId', authenticate, isStreamer, streamController.updateStream);
router.post('/:streamId/stop', authenticate, isStreamer, streamController.stopStream);

// Webhook route (no auth, uses secret)
router.post('/webhook/rtmp', streamController.rtmpWebhook);
router.post('/:streamId/heartbeat', streamController.streamHeartbeat);

module.exports = router;