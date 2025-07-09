// server/src/utils/ffmpegHelper.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/ffmpeg');

// Set FFmpeg paths
ffmpeg.setFfmpegPath(config.ffmpegPath);
ffmpeg.setFfprobePath(config.ffprobePath);

class FFmpegHelper {
  
  // Kiểm tra FFmpeg có available không
  static async checkFFmpegAvailability() {
    return new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          reject(new Error('FFmpeg not available: ' + err.message));
        } else {
          resolve(true);
        }
      });
    });
  }

  // Lấy thông tin video file
  static async getVideoInfo(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            video: videoStream ? {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate),
              bitrate: videoStream.bit_rate
            } : null,
            audio: audioStream ? {
              codec: audioStream.codec_name,
              sampleRate: audioStream.sample_rate,
              channels: audioStream.channels,
              bitrate: audioStream.bit_rate
            } : null
          });
        }
      });
    });
  }

  // Validate video input
  static async validateInput(inputPath) {
    try {
      const stats = await fs.stat(inputPath);
      if (stats.size > config.limits.maxFileSize) {
        throw new Error('File size exceeds maximum limit');
      }

      const info = await this.getVideoInfo(inputPath);
      if (info.duration > config.limits.maxStreamDuration) {
        throw new Error('Video duration exceeds maximum limit');
      }

      return true;
    } catch (error) {
      throw new Error(`Input validation failed: ${error.message}`);
    }
  }

  // Tạo command options cho HLS
  static buildHLSOptions(options = {}) {
    const hlsConfig = config.hls;
    
    return [
      '-c:v', 'libx264',
      '-preset', options.preset || 'veryfast',
      '-tune', 'zerolatency',
      '-crf', options.crf || '23',
      '-maxrate', options.maxrate || '3000k',
      '-bufsize', options.bufsize || '6000k',
      '-g', options.keyframeInterval || '48',
      '-keyint_min', options.keyframeInterval || '48',
      '-sc_threshold', '0',
      '-c:a', 'aac',
      '-b:a', options.audioBitrate || '128k',
      '-ar', '44100',
      '-ac', '2',
      '-f', 'hls',
      '-hls_time', options.segmentDuration || hlsConfig.segmentDuration,
      '-hls_list_size', options.playlistSize || hlsConfig.playlistSize,
      '-hls_flags', options.deleteOldSegments !== false ? 'delete_segments' : 'append_list',
      '-hls_allow_cache', '1'
    ];
  }

  // Tạo adaptive bitrate ladder
  static generateAdaptiveBitrateLadder(inputInfo) {
    const { video } = inputInfo;
    if (!video) return [];

    const ladders = [];
    const presets = config.qualityPresets;

    // Chọn quality dựa trên input resolution
    if (video.width >= 3840) {
      ladders.push(presets.ultra, presets.high, presets.medium, presets.low);
    } else if (video.width >= 1920) {
      ladders.push(presets.high, presets.medium, presets.low);
    } else if (video.width >= 1280) {
      ladders.push(presets.medium, presets.low, presets.mobile);
    } else {
      ladders.push(presets.low, presets.mobile);
    }

    return ladders;
  }

  // Tạo thumbnail options
  static buildThumbnailOptions(outputPath, options = {}) {
    const thumbConfig = config.thumbnail;
    
    return {
      outputOptions: [
        '-vframes', '1',
        '-vf', `scale=${options.width || thumbConfig.width}:${options.height || thumbConfig.height}`,
        '-q:v', options.quality || thumbConfig.quality
      ],
      outputPath: outputPath
    };
  }

  // Cleanup expired files
  static async cleanupExpiredFiles(directory, maxAge = config.cleanup.segmentLifetime) {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up expired file: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired files:', error);
    }
  }

  // Calculate optimal bitrate dựa trên resolution
  static calculateOptimalBitrate(width, height, fps = 24) {
    const pixelCount = width * height;
    const pixelRate = pixelCount * fps;
    
    // Bitrate calculation formula (simplified)
    let bitrate;
    if (pixelRate > 8000000) { // 4K
      bitrate = 15000;
    } else if (pixelRate > 2000000) { // 1080p
      bitrate = 5000;
    } else if (pixelRate > 1000000) { // 720p
      bitrate = 2500;
    } else if (pixelRate > 500000) { // 480p
      bitrate = 1000;
    } else { // 360p and below
      bitrate = 500;
    }
    
    return `${bitrate}k`;
  }

  // Tạo progress callback
  static createProgressCallback(streamKey, eventEmitter) {
    return (progress) => {
      eventEmitter.emit('ffmpegProgress', {
        streamKey,
        progress: {
          frames: progress.frames,
          currentFps: progress.currentFps,
          currentKbps: progress.currentKbps,
          targetSize: progress.targetSize,
          timemark: progress.timemark,
          percent: progress.percent
        }
      });
    };
  }

  // Validate stream key
  static validateStreamKey(streamKey) {
    if (!streamKey || typeof streamKey !== 'string') {
      throw new Error('Invalid stream key');
    }
    
    if (streamKey.length < 8 || streamKey.length > 64) {
      throw new Error('Stream key must be between 8 and 64 characters');
    }
    
    if (!/^[a-zA-Z0-9-_]+$/.test(streamKey)) {
      throw new Error('Stream key can only contain alphanumeric characters, hyphens, and underscores');
    }
    
    return true;
  }

  // Tạo unique filename
  static generateUniqueFilename(extension = 'ts') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}.${extension}`;
  }

  // Format duration từ seconds sang human readable
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Calculate file size in human readable format
  static formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }
}

module.exports = FFmpegHelper;