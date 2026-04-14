import Redis from 'ioredis';
import { config } from './index';

// Create a mock Redis client for when connection fails
const createMockRedis = () => {
    console.warn('⚠️ Redis connection failed. Using in-memory fallback (or no-op).');
    const noop = async () => null;
    return new Proxy({}, {
        get: () => noop
    }) as any;
};

let redis: Redis;

try {
    redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            // Stop retrying after 3 attempts
            if (times > 3) {
                console.error('❌ Redis connection retries exhausted. Disabling Redis.');
                return null;
            }
            return Math.min(times * 50, 2000);
        },
        // Don't queue commands if disconnected, fail fast so try/catches in service work
        enableOfflineQueue: false,
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
        // Only log if not having given up yet
        // console.error('❌ Redis connection error:', err.message);
    });

} catch (error) {
    console.error('Failed to initialize Redis client:', error);
    redis = new Redis({ lazyConnect: true }); // Fallback to avoid crash
}

export default redis;
