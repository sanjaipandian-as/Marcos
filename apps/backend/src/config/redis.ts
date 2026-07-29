import Redis from 'ioredis';
import env from './env.js';
import { isDevOrTest } from './environment.js';

let redis: any;

const redisOptions = {
  maxRetriesPerRequest: null,
  keepAlive: 10000,
  connectTimeout: 5000,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

if (isDevOrTest) {
  try {
    const RedisMock = require('ioredis-mock');
    redis = new RedisMock();
  } catch (err) {
    redis = new Redis(env.REDIS_URL, redisOptions);
  }
} else {
  redis = new Redis(env.REDIS_URL, redisOptions);
}

redis.on('error', (err: any) => {
  console.error('Redis Client Error:', err);
});

export { redis };
export default redis;
