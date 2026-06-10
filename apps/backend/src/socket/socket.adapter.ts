import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import env from '../config/env.js';

export function createRedisAdapter() {
  const pubClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    console.error('Redis Adapter pubClient Error:', err);
  });

  subClient.on('error', (err) => {
    console.error('Redis Adapter subClient Error:', err);
  });

  return createAdapter(pubClient, subClient);
}
