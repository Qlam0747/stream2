const Stream = require('../models/Stream');
const logger = require('../utils/logger');

exports.rtmpWebhook = async (req, res) => {
  try {
    const { app, name, action } = req.body;

    if (app !== 'live') {
      return res.status(400).json({
        success: false,
        error: 'Invalid app',
      });
    }

    const streamKey = name;
    const stream = await Stream.findOne({ streamKey });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    // Update stream status based on action
    if (action === 'publish') {
      stream.status = 'live';
      stream.startedAt = new Date();
      await stream.save();
      logger.info(`Stream went live: ${stream._id}`);
    } else if (action === 'publish_done') {
      stream.status = 'ended';
      stream.endedAt = new Date();
      await stream.save();
      logger.info(`Stream ended: ${stream._id}`);
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    logger.error('Error processing RTMP webhook', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
};

exports.streamHeartbeat = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { viewerCount } = req.body;

    const stream = await Stream.findByIdAndUpdate(
      streamId,
      { lastHeartbeat: new Date(), viewerCount },
      { new: true }
    );

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        updatedAt: stream.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error processing stream heartbeat', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process heartbeat',
    });
  }
};