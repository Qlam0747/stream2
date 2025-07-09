// Cấu hình môi trường
export const ENV = process.env.NODE_ENV || 'development';

// Base URLs
export const getApiBaseUrl = () => {
  return ENV === 'production' 
    ? 'https://api.your-livestream.com' 
    : 'http://localhost:3000/api';
};

export const getSocketUrl = () => {
  return ENV === 'production'
    ? 'https://ws.your-livestream.com'
    : 'http://localhost:3001';
};

export const getCdnConfig = () => ({
  apiUrl: ENV === 'production' 
    ? 'https://cdn-api.your-livestream.com' 
    : 'http://localhost:3002',
  baseUrl: 'https://cdn.your-livestream.com',
  uploadPreset: 'livestream_uploads',
});

// WebRTC Configuration
export const getWebRTCConfig = () => ({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { 
      urls: 'turn:turn.your-livestream.com:3478',
      username: 'your-username',
      credential: 'your-credential',
    },
  ],
  iceCandidatePoolSize: 10,
});

// Loại video stream
export const VIDEO_TYPES = {
  HLS: 'hls',
  WEBRTC: 'webrtc',
  DASH: 'dash',
};

// Các sự kiện stream
export const STREAM_EVENTS = {
  STARTED: 'stream_started',
  ENDED: 'stream_ended',
  PAUSED: 'stream_paused',
  RESUMED: 'stream_resumed',
  VIEWER_JOINED: 'viewer_joined',
  VIEWER_LEFT: 'viewer_left',
};

// Các trạng thái stream
export const STREAM_STATUS = {
  IDLE: 'idle',
  LIVE: 'live',
  ENDED: 'ended',
  ERROR: 'error',
};

// Độ phân giải phổ biến
export const RESOLUTIONS = {
  '240p': { width: 426, height: 240 },
  '360p': { width: 640, height: 360 },
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

// Chất lượng bitrate
export const BITRATES = {
  '240p': 500000,
  '360p': 1000000,
  '480p': 1500000,
  '720p': 3000000,
  '1080p': 6000000,
};

// Các lỗi thường gặp
export const ERROR_CODES = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
  STREAM_ERR_NO_DEVICES: 100,
  STREAM_ERR_PERMISSION_DENIED: 101,
  STREAM_ERR_CONNECTION_FAILED: 200,
  STREAM_ERR_SIGNALING_FAILED: 201,
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'livestream_auth_token',
  USER_SETTINGS: 'livestream_user_settings',
  RECENT_STREAMS: 'livestream_recent_streams',
};