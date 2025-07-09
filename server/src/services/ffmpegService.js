const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class FFmpegService extends EventEmitter {
  constructor() {
    super();
    this.activeStreams = new Map();
    this.outputDir = path.join(__dirname, '../../streams');
    this.hlsDir = path.join(this.outputDir, 'hls');
    this.tempDir = path.join(this.outputDir, 'temp');
    
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.hlsDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  // Tạo HLS stream từ RTMP input
  async createHLSStream(streamKey, options = {}) {
    const streamId = uuidv4();
    const streamPath = path.join(this.hlsDir, streamKey);
    
    try {
      await fs.mkdir(streamPath, { recursive: true });
      
      const hlsOptions = {
        segmentDuration: options.segmentDuration || 6,
        playlistSize: options.playlistSize || 10,
        deleteOldSegments: options.deleteOldSegments !== false,
        ...options
      };

      const command = ffmpeg()
        .input(`rtmp://localhost:1935/live/${streamKey}`)
        .inputOptions([
          '-re', // Read input at native frame rate
          '-fflags', '+genpts'
        ])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-tune', 'zerolatency',
          '-crf', '23',
          '-maxrate', '3000k',
          '-bufsize', '6000k',
          '-g', '48', // GOP size
          '-keyint_min', '48',
          '-sc_threshold', '0',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ar', '44100',
          '-ac', '2',
          '-f', 'hls',
          '-hls_time', hlsOptions.segmentDuration,
          '-hls_list_size', hlsOptions.playlistSize,
          '-hls_flags', hlsOptions.deleteOldSegments ? 'delete_segments' : 'append_list',
          '-hls_segment_filename', `${streamPath}/segment_%03d.ts`,
          '-hls_base_url', `/hls/${streamKey}/`,
          '-hls_allow_cache', '1'
        ])
        .output(`${streamPath}/playlist.m3u8`)
        .on('start', (commandLine) => {
          console.log(`HLS stream started for ${streamKey}:`, commandLine);
          this.emit('streamStarted', { streamKey, streamId, type: 'hls' });
        })
        .on('error', (err) => {
          console.error(`HLS stream error for ${streamKey}:`, err);
          this.emit('streamError', { streamKey, streamId, error: err, type: 'hls' });
          this.activeStreams.delete(streamKey);
        })
        .on('end', () => {
          console.log(`HLS stream ended for ${streamKey}`);
          this.emit('streamEnded', { streamKey, streamId, type: 'hls' });
          this.activeStreams.delete(streamKey);
        });

      command.run();
      
      this.activeStreams.set(streamKey, {
        streamId,
        command,
        type: 'hls',
        startTime: Date.now(),
        options: hlsOptions
      });

      return {
        streamId,
        playlistUrl: `/hls/${streamKey}/playlist.m3u8`,
        streamPath
      };
    } catch (error) {
      console.error('Error creating HLS stream:', error);
      throw error;
    }
  }

  // Tạo multiple quality streams (adaptive bitrate)
  async createAdaptiveHLSStream(streamKey, qualities = []) {
    const streamId = uuidv4();
    const streamPath = path.join(this.hlsDir, streamKey);
    
    // Default qualities nếu không được cung cấp
    const defaultQualities = [
      { resolution: '1920x1080', bitrate: '5000k', audioBitrate: '128k', suffix: '1080p' },
      { resolution: '1280x720', bitrate: '2500k', audioBitrate: '128k', suffix: '720p' },
      { resolution: '854x480', bitrate: '1000k', audioBitrate: '96k', suffix: '480p' },
      { resolution: '640x360', bitrate: '500k', audioBitrate: '64k', suffix: '360p' }
    ];

    const qualityList = qualities.length > 0 ? qualities : defaultQualities;
    
    try {
      await fs.mkdir(streamPath, { recursive: true });
      
      const command = ffmpeg()
        .input(`rtmp://localhost:1935/live/${streamKey}`)
        .inputOptions(['-re', '-fflags', '+genpts']);

      // Tạo outputs cho từng quality
      qualityList.forEach((quality, index) => {
        const outputPath = `${streamPath}/${quality.suffix}`;
        
        command
          .output(`${outputPath}/playlist.m3u8`)
          .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-s', quality.resolution,
            '-b:v', quality.bitrate,
            '-maxrate', quality.bitrate,
            '-bufsize', `${parseInt(quality.bitrate) * 2}k`,
            '-g', '48',
            '-keyint_min', '48',
            '-sc_threshold', '0',
            '-c:a', 'aac',
            '-b:a', quality.audioBitrate,
            '-ar', '44100',
            '-ac', '2',
            '-f', 'hls',
            '-hls_time', '6',
            '-hls_list_size', '10',
            '-hls_flags', 'delete_segments',
            '-hls_segment_filename', `${outputPath}/segment_%03d.ts`,
            '-hls_base_url', `/hls/${streamKey}/${quality.suffix}/`
          ]);
      });

      command
        .on('start', (commandLine) => {
          console.log(`Adaptive HLS stream started for ${streamKey}:`, commandLine);
          this.emit('streamStarted', { streamKey, streamId, type: 'adaptive-hls' });
        })
        .on('error', (err) => {
          console.error(`Adaptive HLS stream error for ${streamKey}:`, err);
          this.emit('streamError', { streamKey, streamId, error: err, type: 'adaptive-hls' });
          this.activeStreams.delete(streamKey);
        })
        .on('end', () => {
          console.log(`Adaptive HLS stream ended for ${streamKey}`);
          this.emit('streamEnded', { streamKey, streamId, type: 'adaptive-hls' });
          this.activeStreams.delete(streamKey);
        });

      command.run();
      
      // Tạo master playlist
      await this.createMasterPlaylist(streamKey, qualityList);
      
      this.activeStreams.set(streamKey, {
        streamId,
        command,
        type: 'adaptive-hls',
        startTime: Date.now(),
        qualities: qualityList
      });

      return {
        streamId,
        masterPlaylistUrl: `/hls/${streamKey}/master.m3u8`,
        streamPath
      };
    } catch (error) {
      console.error('Error creating adaptive HLS stream:', error);
      throw error;
    }
  }

  // Tạo master playlist cho adaptive streaming
  async createMasterPlaylist(streamKey, qualities) {
    const streamPath = path.join(this.hlsDir, streamKey);
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    qualities.forEach(quality => {
      const bandwidth = parseInt(quality.bitrate) * 1000;
      const resolution = quality.resolution;
      
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
      masterPlaylist += `${quality.suffix}/playlist.m3u8\n\n`;
    });

    await fs.writeFile(path.join(streamPath, 'master.m3u8'), masterPlaylist);
  }

  // Convert video file thành HLS
  async convertVideoToHLS(inputFile, outputDir, options = {}) {
    const streamId = uuidv4();
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      const command = ffmpeg(inputFile)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', options.preset || 'medium',
          '-crf', options.crf || '23',
          '-c:a', 'aac',
          '-b:a', options.audioBitrate || '128k',
          '-f', 'hls',
          '-hls_time', options.segmentDuration || 10,
          '-hls_list_size', options.playlistSize || 0,
          '-hls_segment_filename', `${outputDir}/segment_%03d.ts`
        ])
        .output(path.join(outputDir, 'playlist.m3u8'))
        .on('start', (commandLine) => {
          console.log('Video conversion started:', commandLine);
          this.emit('conversionStarted', { streamId, inputFile });
        })
        .on('progress', (progress) => {
          this.emit('conversionProgress', { streamId, progress });
        })
        .on('error', (err) => {
          console.error('Video conversion error:', err);
          this.emit('conversionError', { streamId, error: err });
        })
        .on('end', () => {
          console.log('Video conversion completed');
          this.emit('conversionCompleted', { streamId });
        });

      command.run();
      
      return { streamId, playlistUrl: path.join(outputDir, 'playlist.m3u8') };
    } catch (error) {
      console.error('Error converting video to HLS:', error);
      throw error;
    }
  }

  // Tạo thumbnail từ stream
  async generateThumbnail(streamKey, outputPath) {
    try {
      const command = ffmpeg()
        .input(`rtmp://localhost:1935/live/${streamKey}`)
        .inputOptions(['-ss', '00:00:01'])
        .outputOptions([
          '-vframes', '1',
          '-vf', 'scale=320:240',
          '-q:v', '2'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log(`Thumbnail generated for ${streamKey}`);
          this.emit('thumbnailGenerated', { streamKey, outputPath });
        })
        .on('error', (err) => {
          console.error('Thumbnail generation error:', err);
          this.emit('thumbnailError', { streamKey, error: err });
        });

      command.run();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  // Dừng stream
  async stopStream(streamKey) {
    const stream = this.activeStreams.get(streamKey);
    if (!stream) {
      throw new Error(`Stream ${streamKey} not found`);
    }

    try {
      stream.command.kill('SIGTERM');
      this.activeStreams.delete(streamKey);
      
      // Cleanup files sau 5 phút
      setTimeout(async () => {
        await this.cleanupStreamFiles(streamKey);
      }, 5 * 60 * 1000);
      
      this.emit('streamStopped', { streamKey, streamId: stream.streamId });
      return true;
    } catch (error) {
      console.error('Error stopping stream:', error);
      throw error;
    }
  }

  // Cleanup stream files
  async cleanupStreamFiles(streamKey) {
    const streamPath = path.join(this.hlsDir, streamKey);
    try {
      await fs.rmdir(streamPath, { recursive: true });
      console.log(`Cleaned up files for stream ${streamKey}`);
    } catch (error) {
      console.error('Error cleaning up stream files:', error);
    }
  }

  // Lấy thông tin stream
  getStreamInfo(streamKey) {
    return this.activeStreams.get(streamKey) || null;
  }

  // Lấy danh sách tất cả streams đang active
  getActiveStreams() {
    return Array.from(this.activeStreams.entries()).map(([key, value]) => ({
      streamKey: key,
      ...value
    }));
  }

  // Kiểm tra stream có đang active không
  isStreamActive(streamKey) {
    return this.activeStreams.has(streamKey);
  }
}

module.exports = FFmpegService;