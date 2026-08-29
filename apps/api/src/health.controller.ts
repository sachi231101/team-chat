import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { hostname } from 'os';
import type { Response } from 'express';
import { Public } from './common/decorators';
import { PrismaService } from './common/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller()
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      service: 'team-chat-api',
      hostname: hostname(),
    };
  }

  @Get('ready')
  @Public()
  async ready(@Res({ passthrough: true }) res: Response) {
    const postgres = this.prisma.isConnected;
    const redis = await this.redis.ping();
    const redisOk = process.env.REDIS_REQUIRED === 'true' ? redis : true;
    const ok = postgres && redisOk;
    const body = {
      status: ok ? 'ok' : 'degraded',
      service: 'team-chat-api',
      hostname: hostname(),
      postgres,
      redis,
    };
    res.status(ok ? 200 : 503);
    return body;
  }
}
