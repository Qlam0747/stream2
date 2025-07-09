const Stream = require('../models/Stream');
const { processHLSStream } = require('../services/ffmpegService');
const { generateStreamKey } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.startStream = async (req, res) => {
  try {
    const { title, description, isPrivate } = req.body;
    const userId = req.user.id;

    // Generate unique stream key
    const streamKey = generateStreamKey();

    // Create new stream
    const stream = new Stream({
      title,
      description,
      isPrivate,
      streamKey,
      owner: userId,
      status: 'starting',
    });

    await stream.save();

    // Start processing stream
    await processHLSStream(streamKey);

    logger.info(`Stream started by user ${userId}`, { streamId: stream._id });

    res.status(201).json({
      success: true,
      data: {
        streamId: stream._id,
        streamKey,
        rtmpUrl: `rtmp://${process.env.RTMP_SERVER}/live`,
      },
    });
  } catch (error) {
    logger.error('Error starting stream', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start stream',
    });
  }
};

exports.getStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await Stream.findById(streamId)
      .populate('owner', 'username avatar')
      .lean();

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    // Add HLS playback URL
    const streamWithUrls = {
      ...stream,
      playbackUrl: `${process.env.CDN_BASE_URL}/hls/${stream.streamKey}/index.m3u8`,
    };

    res.status(200).json({
      success: true,
      data: streamWithUrls,
    });
  } catch (error) {
    logger.error('Error getting stream', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get stream',
    });
  }
};

exports.listStreams = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const streams = await Stream.find(query)
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add playback URLs
    const streamsWithUrls = streams.map(stream => ({
      ...stream,
      playbackUrl: `${process.env.CDN_BASE_URL}/hls/${stream.streamKey}/index.m3u8`,
    }));

    const total = await Stream.countDocuments(query);

    res.status(200).json({
      success: true,
      data: streamsWithUrls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (error) {
    logger.error('Error listing streams', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list streams',
    });
  }
};

exports.stopStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.id;

    const stream = await Stream.findOneAndUpdate(
      { _id: streamId, owner: userId },
      { status: 'ended', endedAt: new Date() },
      { new: true }
    );

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found or unauthorized',
      });
    }

    // TODO: Add logic to stop FFmpeg processing

    logger.info(`Stream stopped by user ${userId}`, { streamId });

    res.status(200).json({
      success: true,
      data: {
        message: 'Stream stopped successfully',
      },
    });
  } catch (error) {
    logger.error('Error stopping stream', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to stop stream',
    });
  }
};

exports.updateStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.id;
    const { title, description, isPrivate } = req.body;

    const stream = await Stream.findOneAndUpdate(
      { _id: streamId, owner: userId },
      { title, description, isPrivate },
      { new: true }
    );

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      data: stream,
    });
  } catch (error) {
    logger.error('Error updating stream', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update stream',
    });
  }
};

exports.getStreamByKey = async (req, res) => {
  try {
    const { streamKey } = req.params;

    const stream = await Stream.findOne({ streamKey })
      .populate('owner', 'username avatar')
      .lean();

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    res.status(200).json({
      success: true,
      data: stream,
    });
  } catch (error) {
    logger.error('Error getting stream by key', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get stream',
    });
  }
};

exports.verifyStreamKey = async (req, res) => {
  try {
    const { streamKey } = req.params;

    const stream = await Stream.findOne({ streamKey });

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Invalid stream key',
      });
    }

    if (stream.status === 'ended') {
      return res.status(400).json({
        success: false,
        error: 'Stream has already ended',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        streamId: stream._id,
        ownerId: stream.owner,
      },
    });
  } catch (error) {
    logger.error('Error verifying stream key', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to verify stream key',
    });
  }
};