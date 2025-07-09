const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const STREAMS_DIR = path.join(__dirname, '../../streams');
const HLS_OUTPUT_DIR = path.join(STREAMS_DIR, 'hls');
const TEMP_DIR = path.join(STREAMS_DIR, 'temp');

// Đảm bảo thư mục tồn tại
[STREAMS_DIR, HLS_OUTPUT_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const ffmpegProcesses = new Map();

/**
 * Xử lý RTMP stream thành HLS
 */
const processHLSStream = (streamKey) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(HLS_OUTPUT_DIR, streamKey);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const hlsTime = 4; // Segment duration in seconds
    const hlsListSize = 0; // Keep all segments in playlist
    const hlsFlags = 'delete_segments+append_list'; // Delete old segments and append new ones

    const ffmpegCmd = [
      'ffmpeg',
      '-i', `rtmp://localhost/live/${streamKey}`,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-hls_time', hlsTime,
      '-hls_list_size', hlsListSize,
      '-hls_flags', hlsFlags,
      '-hls_segment_filename', path.join(outputDir, 'segment%03d.ts'),
      '-f', 'hls',
      path.join(outputDir, 'index.m3u8')
    ].join(' ');

    logger.info(`Starting FFmpeg process for stream: ${streamKey}`, { command: ffmpegCmd });

    const ffmpegProcess = exec(ffmpegCmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`FFmpeg process error for stream ${streamKey}`, { error: error.message });
        ffmpegProcesses.delete(streamKey);
        reject(error);
      }
    });

    ffmpegProcesses.set(streamKey, ffmpegProcess);

    ffmpegProcess.stdout.on('data', (data) => {
      logger.debug(`FFmpeg stdout for ${streamKey}: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      logger.debug(`FFmpeg stderr for ${streamKey}: ${data}`);
    });

    // Giả sử sau 2 giây là đã khởi động thành công
    setTimeout(() => {
      resolve(ffmpegProcess);
    }, 2000);
  });
};

/**
 * Dừng xử lý stream
 */
const stopProcessingStream = (streamKey) => {
  return new Promise((resolve) => {
    const ffmpegProcess = ffmpegProcesses.get(streamKey);
    if (ffmpegProcess) {
      logger.info(`Stopping FFmpeg process for stream: ${streamKey}`);
      ffmpegProcess.kill('SIGINT');
      ffmpegProcesses.delete(streamKey);

      // Xóa các file HLS sau khi dừng
      setTimeout(() => {
        const outputDir = path.join(HLS_OUTPUT_DIR, streamKey);
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        resolve(true);
      }, 1000);
    } else {
      resolve(false);
    }
  });
};

/**
 * Tạo thumbnail từ stream
 */
const generateThumbnail = (streamKey) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(TEMP_DIR, `${streamKey}-thumbnail.jpg`);
    const ffmpegCmd = [
      'ffmpeg',
      '-i', `rtmp://localhost/live/${streamKey}`,
      '-ss', '00:00:01',
      '-frames:v', '1',
      '-q:v', '2',
      outputPath
    ].join(' ');

    logger.info(`Generating thumbnail for stream: ${streamKey}`);

    exec(ffmpegCmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Thumbnail generation error for stream ${streamKey}`, { error: error.message });
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
};

module.exports = {
  processHLSStream,
  stopProcessingStream,
  generateThumbnail,
};