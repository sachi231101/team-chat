import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { REDIS_CLIENT, createRedisConnection, redisUrl } from './redis.constants';
import { RedisService } from './redis.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { WorkplaceReadCacheInterceptor } from './workplace-read-cache.interceptor';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const url = redisUrl();
        if (!url) {
          return { ttl: 10_000 };
        }
        return {
          stores: [
            createKeyv(url, {
              throwOnConnectError: process.env.REDIS_REQUIRED === 'true',
            }),
          ],
          ttl: 10_000,
        };
      },
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => createRedisConnection(),
    },
    RedisService,
    RedisThrottlerStorage,
    WorkplaceReadCacheInterceptor,
  ],
  exports: [
    RedisService,
    RedisThrottlerStorage,
    WorkplaceReadCacheInterceptor,
    REDIS_CLIENT,
    CacheModule,
  ],
})
export class RedisModule {}
