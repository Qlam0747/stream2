const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
const logger = require('../utils/logger');
const Stream = require('../models/Stream');

const activeConnections = new Map();

/**
 * Xử lý WebRTC offer từ client
 */
const handleWebRTCOffer = async (streamId, offer) => {
  try {
    const stream = await Stream.findById(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Lưu trữ kết nối
    activeConnections.set(streamId, peerConnection);

    // Xử lý ICE candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug('New ICE candidate:', event.candidate);
      }
    };

    // Xử lý khi kết nối thay đổi trạng thái
    peerConnection.onconnectionstatechange = () => {
      logger.info(`WebRTC connection state: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'disconnected') {
        cleanupConnection(streamId);
      }
    };

    // Nhận stream từ FFmpeg hoặc nguồn khác (giả lập)
    // Trong thực tế, bạn cần thay thế bằng stream thật
    // getStreamFromSource().then(stream => {
    //   stream.getTracks().forEach(track => {
    //     peerConnection.addTrack(track, stream);
    //   });
    // });

    // Thiết lập offer từ client
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    // Tạo answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return {
      answer,
      peerConnection,
    };
  } catch (error) {
    logger.error('Error handling WebRTC offer', { error: error.message });
    throw error;
  }
};

/**
 * Thêm ICE candidate
 */
const addICECandidate = (streamId, candidate) => {
  const peerConnection = activeConnections.get(streamId);
  if (peerConnection) {
    return peerConnection.addIceCandidate(candidate);
  }
  throw new Error('PeerConnection not found');
};

/**
 * Dọn dẹp kết nối
 */
const cleanupConnection = (streamId) => {
  const peerConnection = activeConnections.get(streamId);
  if (peerConnection) {
    peerConnection.close();
    activeConnections.delete(streamId);
    logger.info(`Cleaned up WebRTC connection for stream: ${streamId}`);
  }
};

/**
 * Lấy danh sách các kết nối đang hoạt động
 */
const getActiveConnections = () => {
  return Array.from(activeConnections.keys());
};

module.exports = {
  handleWebRTCOffer,
  addICECandidate,
  cleanupConnection,
  getActiveConnections,
};