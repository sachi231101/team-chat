import { Inject, Injectable, Logger } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT, type RedisClient } from './redis.constants';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {
    if (this.client) {
      this.logger.log('Redis client ready');
    } else {
      this.logger.log('Redis client not configured; cache, throttle storage, and sessions will be local-only');
    }
  }

  get isReady(): boolean {
    return Boolean(this.client?.isOpen);
  }

  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    return this.client;
  }

  async ping(): Promise<boolean> {
    if (!this.client?.isOpen) return false;
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client?.isOpen) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client?.isOpen) return;
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, { EX: ttlSeconds });
      return;
    }
    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client?.isOpen) return;
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.client?.isOpen) return 0;
    return this.client.incr(key);
  }

  async pExpire(key: string, ttlMs: number): Promise<void> {
    if (!this.client?.isOpen) return;
    await this.client.pExpire(key, ttlMs);
  }

  async pTtl(key: string): Promise<number> {
    if (!this.client?.isOpen) return -2;
    return this.client.pTTL(key);
  }
}
