import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { attachMockIdentity } from '../mock-identity';

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    attachMockIdentity(req);

    const requireHeader =
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_MOCK_IDENTITY !== 'true';

    if (requireHeader) {
      const raw = req.headers?.['x-user-id'] ?? req.query?.['x-user-id'];
      const userId = Array.isArray(raw) ? raw[0] : raw;
      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        throw new UnauthorizedException('Authentication required');
      }
    }

    return true;
  }
}
