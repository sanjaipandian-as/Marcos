import Redis from 'ioredis';
import env from './env.js';
import { isDevOrTest } from './environment.js';

let redis: any;

if (isDevOrTest) {
  // If we are in test or dev mode, use ioredis-mock to save real Redis commands
  // and prevent Upstash rate limiting issues.
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

redis.on('error', (err: any) => {
  console.error('Redis Client Error:', err);
});

export { redis };
export default redis;
