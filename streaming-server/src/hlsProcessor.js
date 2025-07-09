const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logger = require('../../server/src/utils/logger');
const config = require('./config/streaming');

class HLSProcessor {
  constructor() {
    this.processes = new Map();
  }

  async startProcessing(streamKey) {
    const outputDir = path.join(config.hls.outputPath, streamKey);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = this.buildFFmpegCommand(streamKey, outputDir);
    logger.info(`Starting HLS processing for ${streamKey}`, { command });

    return new Promise((resolve, reject) => {
      const ffmpegProcess = exec(command, (error) => {
        if (error) {
          logger.error(`HLS processing failed for ${streamKey}`, { error });
          reject(error);
        }
      });

      this.processes.set(streamKey, ffmpegProcess);

      ffmpegProcess.stdout.on('data', (data) => {
        logger.debug(`FFmpeg stdout: ${data}`);
      });

      ffmpegProcess.stderr.on('data', (data) => {
        logger.debug(`FFmpeg stderr: ${data}`);
      });

      setTimeout(() => resolve(ffmpegProcess), 2000);
    });
  }

  buildFFmpegCommand(streamKey, outputDir) {
    return [
      'ffmpeg',
      '-i', `rtmp://localhost:${config.rtmp.rtmp.port}/live/${streamKey}`,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-hls_time', config.hls.segmentDuration.toString(),
      '-hls_list_size', config.hls.playlistSize.toString(),
      '-hls_flags', config.hls.flags.join('+'),
      '-hls_segment_filename', path.join(outputDir, 'segment%03d.ts'),
      '-f', 'hls',
      path.join(outputDir, 'index.m3u8')
    ].join(' ');
  }

  stopProcessing(streamKey) {
    const process = this.processes.get(streamKey);
    if (process) {
      process.kill('SIGINT');
      this.processes.delete(streamKey);
      logger.info(`Stopped HLS processing for ${streamKey}`);
      return true;
    }
    return false;
  }

  cleanup(streamKey) {
    const outputDir = path.join(config.hls.outputPath, streamKey);
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      logger.info(`Cleaned up HLS files for ${streamKey}`);
    }
  }
}

module.exports = new HLSProcessor();