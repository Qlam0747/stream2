const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('error', (error) => {
  logger.error('Redis error', { error: error.message });
});

module.exports = {
  client,
  get: (key) => new Promise((resolve, reject) => {
    client.get(key, (err, reply) => {
      if (err) reject(err);
      else resolve(reply);
    });
  }),
  set: (key, value, ttl) => new Promise((resolve, reject) => {
    if (ttl) {
      client.setex(key, ttl, value, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    } else {
      client.set(key, value, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    }
  }),
  del: (key) => new Promise((resolve, reject) => {
    client.del(key, (err, reply) => {
      if (err) reject(err);
      else resolve(reply);
    });
  })
};