module.exports = {
    // Cấu hình Cloudflare Worker
    worker: {
      name: 'hls-stream-worker',
      route: 'stream.yourdomain.com/*',
      hlsOrigin: 'http://your-origin-server.com/hls',
      // Cloudflare API credentials
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      zoneId: process.env.CLOUDFLARE_ZONE_ID
    },
    // Cấu hình cache
    cache: {
      browserTTL: 3600, // 1 hour
      edgeTTL: 86400   // 1 day
    }
  };