import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../prisma.service';
import { attachMockIdentity, isMockIdentityAllowed } from '../mock-identity';
import { RequestUser } from '../request-user';
import { provisionUserPublicChannels } from '../default-channels';
import {
  profileFromPlatformJwt,
  requestUserFromPlatformJwt,
  verifyPlatformLaunchToken,
} from '../platform-jwt';
import { PlatformVerifyService } from '../platform-verify.service';

@Injectable()
export class IdentityGuard implements CanActivate {
  private readonly logger = new Logger(IdentityGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly platformVerify: PlatformVerifyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization'];
    const tokenQuery = req.query?.['token'];
    const rawToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : typeof tokenQuery === 'string'
        ? tokenQuery.trim()
        : null;

    if (rawToken) {
      try {
        const decoded = verifyPlatformLaunchToken(rawToken);
        const requestUser: RequestUser = requestUserFromPlatformJwt(decoded);
        req.user = requestUser;

        const verifyResult = await this.platformVerify.verifyLaunchToken(rawToken);
        if (!verifyResult.valid) {
          if (verifyResult.suspended) {
            throw new ForbiddenException(verifyResult.error || 'User account is suspended.');
          }
          throw new UnauthorizedException(verifyResult.error || 'Launch token verification failed.');
        }

        const profile = profileFromPlatformJwt(decoded, requestUser.userId);

        try {
          const user = await this.prisma.user.upsert({
            where: { id: requestUser.userId },
            create: {
              id: requestUser.userId,
              email: profile.email,
              name: profile.name,
              avatarUrl: profile.avatarUrl,
              workplaceId: requestUser.workplaceId,
              status: 'ONLINE',
            },
            update: {
              name: profile.name,
              avatarUrl: profile.avatarUrl,
              email: profile.email,
              workplaceId: requestUser.workplaceId,
            },
          });

          await provisionUserPublicChannels(this.prisma, user.id, requestUser.workplaceId);
        } catch (dbErr) {
          this.logger.warn(`Failed to auto-upsert shadow user: ${(dbErr as Error).message}`);
        }

        return true;
      } catch (err: unknown) {
        if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
          throw err;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(`JWT verification failed: ${message}`);
        if (!isMockIdentityAllowed()) {
          throw new UnauthorizedException(`Invalid or expired token: ${message}`);
        }
      }
    }

    if (isMockIdentityAllowed()) {
      attachMockIdentity(req);
      return true;
    }

    throw new UnauthorizedException('Authentication token required');
  }
}
