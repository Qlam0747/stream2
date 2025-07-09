const logger = require('../utils/logger');

module.exports = (io) => {
  const streamNamespace = io.of('/stream');
  
  streamNamespace.on('connection', (socket) => {
    const { streamId } = socket.handshake.query;
    logger.info(`New stream socket connection: ${socket.id} for stream ${streamId}`);
    
    // Join stream room
    socket.join(`stream:${streamId}`);
    
    // Handle viewer count updates
    socket.on('viewerUpdate', (count) => {
      streamNamespace.to(`stream:${streamId}`).emit('viewerCount', count);
    });
    
    // Handle stream status changes
    socket.on('statusChange', (status) => {
      streamNamespace.to(`stream:${streamId}`).emit('streamStatus', status);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Stream socket disconnected: ${socket.id}`);
      socket.leave(`stream:${streamId}`);
    });
  });
};