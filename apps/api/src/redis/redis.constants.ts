import { createClient, type RedisClientType } from 'redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export type RedisClient = RedisClientType | null;

export function redisUrl(): string | null {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.REDIS_HOST) {
    return `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`;
  }
  return null;
}

export async function createRedisConnection(): Promise<RedisClient> {
  const url = redisUrl();
  const required = process.env.REDIS_REQUIRED === 'true';
  if (!url) {
    if (required) {
      throw new Error('REDIS_URL (or REDIS_HOST) is required');
    }
    return null;
  }

  const timeoutMs = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 3000);
  const client = createClient({
    url,
    socket: {
      connectTimeout: timeoutMs,
    },
  });

  try {
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Redis connection timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
    return client as RedisClientType;
  } catch (error) {
    await client.quit().catch(() => undefined);
    if (required) {
      throw error;
    }
    return null;
  }
}
