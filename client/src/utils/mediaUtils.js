/**
 * Kiểm tra hỗ trợ WebRTC của trình duyệt
 */
export const checkWebRTCSupport = () => {
    return (
      typeof window !== 'undefined' &&
      window.RTCPeerConnection &&
      window.RTCSessionDescription &&
      window.RTCIceCandidate
    );
  };
  
  /**
   * Kiểm tra hỗ trợ HLS của trình duyệt
   */
  export const checkHLSSupport = () => {
    const video = document.createElement('video');
    const isNativeSupport = video.canPlayType('application/vnd.apple.mpegurl');
    return isNativeSupport || (window.Hls && window.Hls.isSupported());
  };
  
  /**
   * Kiểm tra hỗ trợ MediaDevices API
   */
  export const checkMediaDevicesSupport = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };
  
  /**
   * Chuyển đổi thời gian (giây) sang định dạng HH:MM:SS
   */
  export const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return [h, m, s]
      .map(v => v < 10 ? `0${v}` : v)
      .filter((v, i) => v !== '00' || i > 0)
      .join(':');
  };
  
  /**
   * Tính toán bitrate từ dữ liệu mạng
   */
  export const calculateBitrate = (previousStats, currentStats, timespanMs) => {
    if (!previousStats || !currentStats || timespanMs <= 0) return 0;
    
    const bytesDiff = currentStats.bytesReceived - previousStats.bytesReceived;
    const bitsDiff = bytesDiff * 8;
    const timespanSeconds = timespanMs / 1000;
    
    return Math.floor(bitsDiff / timespanSeconds); // bits per second
  };
  
  /**
   * Lấy thông tin thiết bị camera/microphone
   */
  export const getDeviceInfo = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        cameras: devices.filter(d => d.kind === 'videoinput'),
        microphones: devices.filter(d => d.kind === 'audioinput'),
        speakers: devices.filter(d => d.kind === 'audiooutput'),
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        cameras: [],
        microphones: [],
        speakers: [],
      };
    }
  };
  
  /**
   * Tạo constraints cho getUserMedia
   */
  export const createMediaConstraints = (options = {}) => {
    const {
      video = true,
      audio = true,
      cameraDeviceId,
      microphoneDeviceId,
      resolution,
      frameRate,
    } = options;
    
    const constraints = {
      video: video ? {
        deviceId: cameraDeviceId ? { exact: cameraDeviceId } : undefined,
        width: resolution?.width ? { ideal: resolution.width } : undefined,
        height: resolution?.height ? { ideal: resolution.height } : undefined,
        frameRate: frameRate ? { ideal: frameRate } : undefined,
        facingMode: 'user',
      } : false,
      audio: audio ? {
        deviceId: microphoneDeviceId ? { exact: microphoneDeviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } : false,
    };
    
    return constraints;
  };
  
  /**
   * Tạo thumbnail từ video element
   */
  export const captureThumbnail = (videoElement, quality = 0.7) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', quality);
  };
  
  /**
   * Kiểm tra codec hỗ trợ
   */
  export const checkCodecSupport = async (codec) => {
    try {
      const support = await navigator.mediaCapabilities.decodingInfo({
        type: 'file',
        video: {
          contentType: `video/${codec}`,
          width: 1280,
          height: 720,
          bitrate: 2000000,
          framerate: 30,
        },
      });
      return support.supported;
    } catch (error) {
      console.error('Error checking codec support:', error);
      return false;
    }
  };