import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { CommonModule } from './common/common.module';
import { ChatModule } from './chat/chat.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PresenceModule } from './presence/presence.module';
import { SearchModule } from './search/search.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AiModule } from './ai/ai.module';
import { RedisModule } from './redis/redis.module';
import { RedisThrottlerStorage } from './redis/redis-throttler.storage';
import { RedisService } from './redis/redis.service';
import { IdentityGuard, PermissionsGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorage, RedisService],
      useFactory: (storage: RedisThrottlerStorage, redis: RedisService) => ({
        storage: redis.isReady ? storage : undefined,
        throttlers: [
          {
            ttl: 60000,
            limit: process.env.NODE_ENV === 'production' ? 200 : 2000,
          },
        ],
        skipIf: (context) => {
          const req = context.switchToHttp().getRequest<{ url?: string }>();
          const url = req.url || '';
          return url.startsWith('/health') || url.startsWith('/ready');
        },
      }),
    }),
    CommonModule,
    ChatModule,
    AttachmentsModule,
    NotificationsModule,
    PresenceModule,
    SearchModule,
    RealtimeModule,
    AiModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: IdentityGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
