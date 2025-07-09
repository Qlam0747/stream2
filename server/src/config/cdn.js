module.exports = {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      s3Bucket: process.env.AWS_S3_BUCKET,
      cloudFrontDistribution: process.env.AWS_CLOUDFRONT_DISTRIBUTION
    },
    baseUrl: process.env.CDN_BASE_URL,
    uploadPresets: {
      image: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 80,
        formats: ['webp', 'jpg']
      },
      video: {
        maxDuration: 60 * 5, // 5 minutes
        maxResolution: '1080p'
      }
    }
  };