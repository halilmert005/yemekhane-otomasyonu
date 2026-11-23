const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('Redis hatasi:', err.message);
});

async function redisKontrol() {
  return redis.ping();
}

module.exports = {
  redis,
  redisKontrol,
};
