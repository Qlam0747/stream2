const NodeMediaServer = require('node-media-server');
const { initStreamDirectories } = require('../../server/src/utils/streamManager');
const logger = require('../../server/src/utils/logger');
const config = require('./config/streaming');

class RTMPServer {
  constructor() {
    this.nms = new NodeMediaServer(config.rtmp);
    initStreamDirectories();
  }

  start() {
    this.nms.run();
    logger.info('RTMP Server started', { 
      port: config.rtmp.rtmp.port,
      hlsPath: config.rtmp.http.mediaroot
    });

    this.nms.on('prePublish', (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/').pop();
      logger.info(`Stream started: ${streamKey}`, { clientId: id });
      
      // Xác thực stream key ở đây nếu cần
      if (!this.validateStreamKey(streamKey)) {
        const session = this.nms.getSession(id);
        session.reject();
        logger.warn(`Invalid stream key rejected: ${streamKey}`);
      }
    });

    this.nms.on('donePublish', (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/').pop();
      logger.info(`Stream ended: ${streamKey}`, { clientId: id });
    });
  }

  validateStreamKey(streamKey) {
    // Triển khai logic xác thực stream key
    // Có thể kết nối với database hoặc API
    return /^[a-f0-9]{32}$/.test(streamKey); // Ví dụ đơn giản
  }

  stop() {
    this.nms.stop();
    logger.info('RTMP Server stopped');
  }
}

module.exports = new RTMPServer();