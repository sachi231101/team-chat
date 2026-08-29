import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ) {
    if (!this.redis.isReady) {
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${redisKey}:block`;

    const blockedTtl = await this.redis.pTtl(blockKey);
    if (blockedTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockedTtl,
      };
    }

    const hits = await this.redis.incr(redisKey);
    if (hits === 1) {
      await this.redis.pExpire(redisKey, ttl);
    }

    const timeToExpire = Math.max(0, await this.redis.pTtl(redisKey));
    let isBlocked = false;
    let timeToBlockExpire = 0;

    if (hits > limit && blockDuration > 0) {
      await this.redis.set(blockKey, '1');
      await this.redis.pExpire(blockKey, blockDuration);
      isBlocked = true;
      timeToBlockExpire = blockDuration;
    }

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
