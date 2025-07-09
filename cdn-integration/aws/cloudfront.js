const AWS = require('aws-sdk');
const logger = require('../../server/src/utils/logger');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const cloudFront = new AWS.CloudFront();
const DISTRIBUTION_ID = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;

class CloudFrontManager {
  static async invalidatePaths(paths) {
    const params = {
      DistributionId: DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    };

    try {
      const data = await cloudFront.createInvalidation(params).promise();
      logger.info('CloudFront invalidation created', { invalidationId: data.Invalidation.Id });
      return data;
    } catch (error) {
      logger.error('CloudFront invalidation failed', { error });
      throw error;
    }
  }

  static async getSignedUrl(url, expiresIn = 3600) {
    const params = {
      url: url,
      expires: Math.floor(Date.now() / 1000) + expiresIn
    };

    try {
      const signedUrl = cloudFront.getSignedUrl(params);
      logger.debug('CloudFront signed URL generated');
      return signedUrl;
    } catch (error) {
      logger.error('CloudFront signed URL failed', { error });
      throw error;
    }
  }
}

module.exports = CloudFrontManager;