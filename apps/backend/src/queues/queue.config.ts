import env from '../config/env.js';

// Connection details derived from Redis URL
const url = new URL(env.REDIS_URL);

export const connectionOptions: any = {
  host: url.hostname || '127.0.0.1',
  port: parseInt(url.port || '6379'),
  username: url.username || undefined,
  password: url.password || undefined,
  maxRetriesPerRequest: null,
};

if (url.protocol === 'rediss:') {
  connectionOptions.tls = {};
}

export const QUEUE_NAME = 'marcos-jobs';

export default connectionOptions;
