module.exports = {
    rtmp: {
      rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
      },
      http: {
        port: 8000,
        mediaroot: './streams/hls',
        allow_origin: '*'
      },
      trans: {
        ffmpeg: '/usr/bin/ffmpeg',
        tasks: [
          {
            app: 'live',
            hls: true,
            hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]'
          }
        ]
      }
    },
    webrtc: {
      port: 8888,
      rtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { 
            urls: 'turn:your-turn-server.com',
            username: 'your-username',
            credential: 'your-credential'
          }
        ]
      },
      allowedOrigins: [
        'http://localhost:3000',
        'https://yourdomain.com'
      ]
    },
    hls: {
      outputPath: './streams/hls',
      segmentDuration: 4, // seconds
      playlistSize: 0, // 0 = keep all segments
      flags: ['delete_segments', 'append_list']
    }
  };