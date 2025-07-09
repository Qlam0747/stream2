const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { uploadToCDN } = require('./cdnService');

const STREAMS_DIR = path.join(__dirname, '../../streams');
const HLS_OUTPUT_DIR = path.join(STREAMS_DIR, 'hls');

/**
 * Theo dõi và xử lý HLS stream
 */
const monitorHLSStream = (streamKey) => {
  return new Promise((resolve, reject) => {
    const streamDir = path.join(HLS_OUTPUT_DIR, streamKey);
    const manifestPath = path.join(streamDir, 'index.m3u8');

    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    // Kiểm tra định kỳ xem file manifest đã được tạo chưa
    const checkInterval = setInterval(() => {
      if (fs.existsSync(manifestPath)) {
        clearInterval(checkInterval);
        logger.info(`HLS manifest created for stream: ${streamKey}`);
        resolve({
          manifestPath,
          streamDir,
        });
      }
    }, 1000);

    // Timeout sau 30 giây nếu không tạo được manifest
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Timeout waiting for HLS manifest'));
    }, 30000);
  });
};

/**
 * Tải lên HLS stream lên CDN
 */
const uploadHLSToCDN = async (streamKey) => {
  try {
    const streamDir = path.join(HLS_OUTPUT_DIR, streamKey);
    const files = fs.readdirSync(streamDir);

    const uploadPromises = files.map(file => {
      const filePath = path.join(streamDir, file);
      const fileData = fs.readFileSync(filePath);
      const cdnPath = `hls/${streamKey}/${file}`;

      return uploadToCDN(fileData, cdnPath, getContentType(file));
    });

    await Promise.all(uploadPromises);
    logger.info(`Uploaded HLS files to CDN for stream: ${streamKey}`);

    return {
      manifestUrl: `${process.env.CDN_BASE_URL}/hls/${streamKey}/index.m3u8`,
    };
  } catch (error) {
    logger.error('Error uploading HLS to CDN', { error: error.message });
    throw error;
  }
};

/**
 * Xóa HLS stream cục bộ
 */
const cleanupHLSStream = (streamKey) => {
  try {
    const streamDir = path.join(HLS_OUTPUT_DIR, streamKey);
    if (fs.existsSync(streamDir)) {
      fs.rmSync(streamDir, { recursive: true, force: true });
      logger.info(`Cleaned up HLS files for stream: ${streamKey}`);
    }
  } catch (error) {
    logger.error('Error cleaning up HLS files', { error: error.message });
  }
};

/**
 * Xác định content type cho file HLS
 */
const getContentType = (filename) => {
  if (filename.endsWith('.m3u8')) {
    return 'application/vnd.apple.mpegurl';
  } else if (filename.endsWith('.ts')) {
    return 'video/mp2t';
  }
  return 'application/octet-stream';
};

module.exports = {
  monitorHLSStream,
  uploadHLSToCDN,
  cleanupHLSStream,
};