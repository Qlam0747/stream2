const Message = require('../models/Message');
const Stream = require('../models/Stream');
const logger = require('../utils/logger');

exports.getChatHistory = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 100 } = req.query;

    // Verify stream exists
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    const messages = await Message.find({ stream: streamId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Return oldest first
    });
  } catch (error) {
    logger.error('Error getting chat history', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history',
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // Verify stream exists and is live
    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        error: 'Stream is not live',
      });
    }

    // Create message
    const message = new Message({
      text,
      user: userId,
      stream: streamId,
    });

    await message.save();

    // Populate user data for response
    const populatedMessage = await Message.populate(message, {
      path: 'user',
      select: 'username avatar',
    });

    logger.info(`Chat message sent to stream ${streamId} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    logger.error('Error sending chat message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOneAndDelete({
      _id: messageId,
      $or: [{ user: userId }, { isAdmin: true }],
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or unauthorized',
      });
    }

    logger.info(`Chat message deleted: ${messageId}`);

    res.status(200).json({
      success: true,
      data: {
        message: 'Message deleted successfully',
      },
    });
  } catch (error) {
    logger.error('Error deleting chat message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
    });
  }
};