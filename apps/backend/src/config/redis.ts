import Redis from 'ioredis';
import env from './env.js';

let redis: Redis;

if (env.NODE_ENV === 'test') {
  // If we are in test mode, we might want to import and use ioredis-mock
  // but to keep it simple, we check if the caller provided mock or use default
  try {
    const RedisMock = require('ioredis-mock');
    redis = new RedisMock();
  } catch (err) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
} else {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

export { redis };
export default redis;
