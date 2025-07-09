const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../../server/src/utils/logger');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET = process.env.AWS_S3_BUCKET;

class S3Uploader {
  static async uploadFile(filePath, key, contentType) {
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'public-read'
    };

    try {
      const data = await s3.upload(params).promise();
      logger.info(`File uploaded to S3: ${data.Location}`);
      return data;
    } catch (error) {
      logger.error('S3 upload failed', { error });
      throw error;
    }
  }

  static async uploadBuffer(buffer, key, contentType) {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    try {
      const data = await s3.upload(params).promise();
      logger.info(`Buffer uploaded to S3: ${data.Location}`);
      return data;
    } catch (error) {
      logger.error('S3 upload failed', { error });
      throw error;
    }
  }

  static async deleteFile(key) {
    const params = {
      Bucket: BUCKET,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
      logger.info(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      logger.error('S3 delete failed', { error });
      throw error;
    }
  }
}

module.exports = S3Uploader;