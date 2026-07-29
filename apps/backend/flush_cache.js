const dotenv = require('dotenv');
const Redis = require('ioredis');

// Load the .env file
dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('REDIS_URL not found in .env file!');
  process.exit(1);
}

console.log('Connecting to Redis...');
const redis = new Redis(redisUrl);

redis.flushall()
  .then(() => {
    console.log('Success: Redis Cache Flushed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error flushing Redis cache:', err);
    process.exit(1);
  });
