// server/src/config/ffmpeg.js
const path = require('path');

module.exports = {
  // FFmpeg binary path (tự động detect hoặc set manual)
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  
  // Directories
  streamsDir: path.join(__dirname, '../../streams'),
  hlsDir: path.join(__dirname, '../../streams/hls'),
  tempDir: path.join(__dirname, '../../streams/temp'),
  uploadsDir: path.join(__dirname, '../../uploads'),
  
  // RTMP Settings
  rtmp: {
    port: 1935,
    host: 'localhost',
    streamPath: '/live',
    chunkSize: 60000,
    gop: 30,
    ping: 30,
    pingTimeout: 60
  },
  
  // HLS Settings
  hls: {
    segmentDuration: 6, // seconds
    playlistSize: 10, // number of segments
    deleteOldSegments: true,
    allowCache: true,
    baseUrl: '/hls',
    cleanupDelay: 300000 // 5 minutes
  },
  
  // Video Quality Presets
  qualityPresets: {
    // Ultra Quality (4K)
    ultra: {
      resolution: '3840x2160',
      bitrate: '15000k',
      audioBitrate: '320k',
      suffix: '2160p',
      preset: 'fast',
      crf: '18'
    },
    
    // High Quality (1080p)
    high: {
      resolution: '1920x1080',
      bitrate: '5000k',
      audioBitrate: '128k',
      suffix: '1080p',
      preset: 'veryfast',
      crf: '23'
    },
    
    // Medium Quality (720p)
    medium: {
      resolution: '1280x720',
      bitrate: '2500k',
      audioBitrate: '128k',
      suffix: '720p',
      preset: 'veryfast',
      crf: '23'
    },
    
    // Low Quality (480p)
    low: {
      resolution: '854x480',
      bitrate: '1000k',
      audioBitrate: '96k',
      suffix: '480p',
      preset: 'veryfast',
      crf: '25'
    },
    
    // Mobile Quality (360p)
    mobile: {
      resolution: '640x360',
      bitrate: '500k',
      audioBitrate: '64k',
      suffix: '360p',
      preset: 'veryfast',
      crf: '28'
    }
  },
  
  // Encoding Settings
  encoding: {
    // Video
    videoCodec: 'libx264',
    videoPreset: 'veryfast',
    videoProfile: 'baseline',
    videoLevel: '3.1',
    pixelFormat: 'yuv420p',
    
    // Audio
    audioCodec: 'aac',
    audioProfile: 'aac_low',
    audioSampleRate: 44100,
    audioChannels: 2,
    
    // Keyframes
    keyframeInterval: 48, // 2 seconds at 24fps
    sceneChangeThreshold: 0,
    
    // Buffer settings
    bufferSize: '2000k',
    maxBitrate: '5000k',
    minBitrate: '500k'
  },
  
  // Thumbnail Settings
  thumbnail: {
    width: 320,
    height: 240,
    quality: 2,
    format: 'jpg',
    interval: 30 // seconds
  },
  
  // Processing limits
  limits: {
    maxConcurrentStreams: 10,
    maxStreamDuration: 7200, // 2 hours
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxBitrate: 10000, // kbps
    timeout: 30000 // 30 seconds
  },
  
  // Cleanup settings
  cleanup: {
    segmentLifetime: 300000, // 5 minutes
    tempFileLifetime: 3600000, // 1 hour
    logLifetime: 86400000 // 24 hours
  }
};