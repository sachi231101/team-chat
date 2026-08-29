import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from './redis.service';

const DEFAULT_TTL_SECONDS = 10;

@Injectable()
export class WorkplaceReadCacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (!this.redis.isReady) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    if (req.method !== 'GET') {
      return next.handle();
    }

    const workplaceId = req.user?.workplaceId || 'default';
    const userId = req.user?.userId || req.user?.id || 'anon';
    const key = `cache:${workplaceId}:${userId}:${req.method}:${req.originalUrl}`;

    const hit = await this.redis.get(key);
    if (hit) {
      try {
        return of(JSON.parse(hit));
      } catch {
        await this.redis.del(key);
      }
    }

    return next.handle().pipe(
      tap((data) => {
        void this.redis.set(key, JSON.stringify(data), DEFAULT_TTL_SECONDS);
      }),
    );
  }
}
