// server/src/controllers/ffmpegController.js
const FFmpegService = require('../services/ffmpegService');
const FFmpegHelper = require('../utils/ffmpegHelper');
const config = require('../config/ffmpeg');
const path = require('path');

class FFmpegController {
  constructor() {
    this.ffmpegService = new FFmpegService();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Lắng nghe events từ FFmpeg service
    this.ffmpegService.on('streamStarted', (data) => {
      console.log('Stream started:', data);
      // Có thể emit socket event tới clients
    });

    this.ffmpegService.on('streamError', (data) => {
      console.error('Stream error:', data);
      // Notify clients về lỗi
    });

    this.ffmpegService.on('streamEnded', (data) => {
      console.log('Stream ended:', data);
      // Cleanup và notify clients
    });

    this.ffmpegService.on('ffmpegProgress', (data) => {
      // Broadcast progress tới clients
      console.log('FFmpeg progress:', data);
    });
  }

  // Bắt đầu HLS stream
  async startHLSStream(req, res) {
    try {
      const { streamKey, quality = 'medium' } = req.body;
      
      // Validate
      FFmpegHelper.validateStreamKey(streamKey);
      
      // Kiểm tra stream đã tồn tại chưa
      if (this.ffmpegService.isStreamActive(streamKey)) {
        return res.status(400).json({
          error: 'Stream already active',
          streamKey
        });
      }
        // Bắt đầu stream   
        const outputPath = path.join(config.hlsOutputDir, `${streamKey}.m3u8`);
        await this.ffmpegService.startHLSStream(streamKey, quality, outputPath);
        res.status(200).json({
          message: 'Stream started successfully',
          streamKey,
          outputPath
        });
    } catch (error) {
      console.error('Error starting HLS stream:', error);
        res.status(500).json({
            error: 'Failed to start HLS stream',
            details: error.message
        });
    }
  } 
    // Dừng HLS stream
    async stopHLSStream(req, res) {
        try {
            const { streamKey } = req.body;
            // Validate
            FFmpegHelper.validateStreamKey(streamKey);
            
            // Dừng stream
            await this.ffmpegService.stopHLSStream(streamKey);
            res.status(200).json({
                message: 'Stream stopped successfully',
                streamKey
            });
        } catch (error) {
            console.error('Error stopping HLS stream:', error);
            res.status(500).json({
                error: 'Failed to stop HLS stream',
                details: error.message
            });
        }
    }     
    // Lấy thông tin stream
    async getStreamInfo(req, res) {
        try {
            const { streamKey } = req.params;
            // Validate
            FFmpegHelper.validateStreamKey(streamKey);
            
            // Lấy thông tin stream
            const info = await this.ffmpegService.getStreamInfo(streamKey);
            if (!info) {
                return res.status(404).json({
                    error: 'Stream not found',
                    streamKey
                });
            }
            res.status(200).json(info);
        } catch (error) {
            console.error('Error getting stream info:', error);
            res.status(500).json({
                error: 'Failed to get stream info',
                details: error.message
            });
        }
    }   
    // Lấy danh sách các stream đang hoạt động
    async getActiveStreams(req, res) {
        try {
            const streams = this.ffmpegService.getActiveStreams();
            res.status(200).json(streams);
        } catch (error) {
            console.error('Error getting active streams:', error);
            res.status(500).json({
                error: 'Failed to get active streams',
                details: error.message
            });
        }
    }
    // Xử lý lỗi chung
    handleError(err, req, res, next) {
        console.error('FFmpegController error:', err);
        res.status(500).json({
            error: 'Internal server error',
            details: err.message
        });
    }
    // Xử lý các request không hợp lệ
    handleInvalidRequest(req, res) {
        res.status(400).json({
            error: 'Invalid request',
            message: 'Please check your request parameters'
        });
    }
}
module.exports = new FFmpegController();
