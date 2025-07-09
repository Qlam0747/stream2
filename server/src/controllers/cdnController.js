const { uploadToS3, generatePresignedUrl } = require('../services/cdnService');
const logger = require('../utils/logger');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.id;
    const { type = 'misc' } = req.body;

    // Generate unique filename
    const extension = originalname.split('.').pop();
    const filename = `${userId}-${Date.now()}.${extension}`;
    const key = `${type}/${filename}`;

    // Upload to CDN
    const result = await uploadToS3(buffer, key, mimetype);

    logger.info(`File uploaded to CDN by user ${userId}`, { key });

    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
      },
    });
  } catch (error) {
    logger.error('Error uploading file to CDN', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
    });
  }
};

exports.generateUploadUrl = async (req, res) => {
  try {
    const { fileType, fileName } = req.body;
    const userId = req.user.id;

    if (!fileType || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'fileType and fileName are required',
      });
    }

    const extension = fileName.split('.').pop();
    const key = `uploads/${userId}-${Date.now()}.${extension}`;

    const presignedUrl = await generatePresignedUrl(key, fileType);

    logger.info(`Presigned URL generated for user ${userId}`, { key });

    res.status(200).json({
      success: true,
      data: {
        uploadUrl: presignedUrl,
        key,
        publicUrl: `${process.env.CDN_BASE_URL}/${key}`,
      },
    });
  } catch (error) {
    logger.error('Error generating upload URL', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload URL',
    });
  }
};

exports.getStreamPlaybackUrl = async (req, res) => {
  try {
    const { streamKey } = req.params;

    // In a real implementation, you would verify the user has access to this stream
    const playbackUrl = `${process.env.CDN_BASE_URL}/hls/${streamKey}/index.m3u8`;

    res.status(200).json({
      success: true,
      data: {
        playbackUrl,
      },
    });
  } catch (error) {
    logger.error('Error generating playback URL', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate playback URL',
    });
  }
};