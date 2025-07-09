const express = require('express');
const router = express.Router();
const cdnController = require('../controllers/cdnController');
const { authenticate } = require('../middleware/auth');
const upload = require('../utils/multerConfig');

// Authenticated routes
router.post('/upload', authenticate, upload.single('file'), cdnController.uploadFile);
router.post('/upload-url', authenticate, cdnController.generateUploadUrl);
router.get('/stream/:streamKey/playback', authenticate, cdnController.getStreamPlaybackUrl);

module.exports = router;