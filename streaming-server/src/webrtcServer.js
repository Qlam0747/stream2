const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { RTCSessionDescription } = require('wrtc');
const logger = require('../../server/src/utils/logger');
const config = require('./config/streaming');

class WebRTCServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIO(this.server, {
      cors: {
        origin: config.webrtc.allowedOrigins,
        methods: ["GET", "POST"]
      }
    });

    this.peerConnections = new Map();
  }

  start() {
    this.server.listen(config.webrtc.port, () => {
      logger.info(`WebRTC Server started on port ${config.webrtc.port}`);
    });

    this.io.on('connection', (socket) => {
      logger.info(`New WebRTC connection: ${socket.id}`);

      socket.on('join', (streamId) => {
        socket.join(streamId);
        logger.info(`Client ${socket.id} joined stream ${streamId}`);
      });

      socket.on('offer', async ({ streamId, offer }, callback) => {
        try {
          const peerConnection = new RTCPeerConnection(config.webrtc.rtcConfig);
          this.peerConnections.set(socket.id, peerConnection);

          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          callback({ answer });

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('ice-candidate', { candidate: event.candidate });
            }
          };

          // Xử lý stream từ server (simulate)
          // this.setupStream(peerConnection, streamId);
        } catch (error) {
          logger.error('WebRTC offer error', { error });
          callback({ error: 'Failed to process offer' });
        }
      });

      socket.on('ice-candidate', ({ candidate }) => {
        const peerConnection = this.peerConnections.get(socket.id);
        if (peerConnection && candidate) {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('disconnect', () => {
        const peerConnection = this.peerConnections.get(socket.id);
        if (peerConnection) {
          peerConnection.close();
          this.peerConnections.delete(socket.id);
        }
        logger.info(`WebRTC disconnected: ${socket.id}`);
      });
    });
  }

  stop() {
    this.server.close();
    logger.info('WebRTC Server stopped');
  }
}

module.exports = new WebRTCServer();