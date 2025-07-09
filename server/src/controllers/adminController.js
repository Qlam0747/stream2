const User = require('../models/User');
const Stream = require('../models/Stream');
const logger = require('../utils/logger');

exports.getSystemStats = async (req, res) => {
  try {
    const [totalUsers, activeStreams, totalStreams] = await Promise.all([
      User.countDocuments(),
      Stream.countDocuments({ status: 'live' }),
      Stream.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeStreams,
        totalStreams,
      },
    });
  } catch (error) {
    logger.error('Error getting system stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get system stats',
    });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true, banReason: reason },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // End all active streams by this user
    await Stream.updateMany(
      { owner: userId, status: 'live' },
      { status: 'ended', endedAt: new Date(), endedByAdmin: true }
    );

    logger.info(`User banned: ${user._id}`, { reason });

    res.status(200).json({
      success: true,
      data: {
        message: 'User banned successfully',
      },
    });
  } catch (error) {
    logger.error('Error banning user', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to ban user',
    });
  }
};

exports.deleteStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { reason } = req.body;

    const stream = await Stream.findByIdAndUpdate(
      streamId,
      { status: 'removed', removedAt: new Date(), removeReason: reason },
      { new: true }
    );

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    // TODO: Add logic to delete HLS files from CDN

    logger.info(`Stream deleted by admin: ${stream._id}`, { reason });

    res.status(200).json({
      success: true,
      data: {
        message: 'Stream deleted successfully',
      },
    });
  } catch (error) {
    logger.error('Error deleting stream', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete stream',
    });
  }
};