const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Cấu hình AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const cloudFront = new AWS.CloudFront();

/**
 * Tải lên file lên S3
 */
const uploadToS3 = (fileData, key, contentType) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileData,
      ContentType: contentType,
      ACL: 'public-read',
    };

    s3.upload(params, (err, data) => {
      if (err) {
        logger.error('Error uploading to S3', { error: err.message });
        reject(err);
      } else {
        logger.info(`File uploaded to S3: ${key}`);
        resolve({
          url: data.Location,
          key: data.Key,
        });
      }
    });
  });
};

/**
 * Tạo signed URL cho upload trực tiếp
 */
const generatePresignedUrl = (key, contentType) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
      Expires: 60 * 5, // 5 phút
    };

    s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
        logger.error('Error generating presigned URL', { error: err.message });
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
};

/**
 * Xóa file từ S3
 */
const deleteFromS3 = (key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        logger.error('Error deleting from S3', { error: err.message });
        reject(err);
      } else {
        logger.info(`File deleted from S3: ${key}`);
        resolve(data);
      }
    });
  });
};

/**
 * Tạo signed URL cho CloudFront
 */
const generateCloudFrontSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    url: `${process.env.CDN_BASE_URL}/${key}`,
    expires: Math.floor((Date.now() + expiresIn * 1000) / 1000),
  };

  const signedUrl = cloudFront.getSignedUrl(params);
  return signedUrl;
};

/**
 * Tải lên file lên CDN (S3 + CloudFront)
 */
const uploadToCDN = async (fileData, key, contentType) => {
  try {
    // Upload lên S3
    const s3Result = await uploadToS3(fileData, key, contentType);

    // Tạo URL CloudFront
    const cdnUrl = `${process.env.CDN_BASE_URL}/${key}`;

    return {
      ...s3Result,
      cdnUrl,
    };
  } catch (error) {
    logger.error('Error uploading to CDN', { error: error.message });
    throw error;
  }
};

module.exports = {
  uploadToS3,
  generatePresignedUrl,
  deleteFromS3,
  generateCloudFrontSignedUrl,
  uploadToCDN,
};