const logger = require('../utils/logger');
const Message = require('../models/Message');

module.exports = (io) => {
  const chatNamespace = io.of('/chat');
  
  chatNamespace.on('connection', (socket) => {
    const { streamId, userId } = socket.handshake.query;
    logger.info(`New chat socket connection: ${socket.id} for stream ${streamId}`);
    
    // Join stream chat room
    socket.join(`chat:${streamId}`);
    
    // Handle new messages
    socket.on('sendMessage', async (message, callback) => {
      try {
        const newMessage = new Message({
          text: message.text,
          user: userId,
          stream: streamId
        });
        
        await newMessage.save();
        
        // Broadcast to room
        chatNamespace.to(`chat:${streamId}`).emit('newMessage', {
          ...newMessage.toObject(),
          user: { _id: userId, username: socket.handshake.query.username }
        });
        
        callback({ success: true });
      } catch (error) {
        logger.error('Error saving chat message', { error: error.message });
        callback({ success: false, error: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (isTyping) => {
      socket.to(`chat:${streamId}`).emit('userTyping', {
        userId,
        username: socket.handshake.query.username,
        isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Chat socket disconnected: ${socket.id}`);
      socket.leave(`chat:${streamId}`);
    });
  });
};