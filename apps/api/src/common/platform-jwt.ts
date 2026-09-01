import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import {
  getSharedJwtSecret,
  JWT_AUDIENCE_TEAM_CHAT,
  JWT_ISSUER,
} from './jwt-config';
import { mapPlatformPermissions } from './platform-permissions';
import type { RequestUser } from './request-user';

export interface PlatformJwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  workspaceId?: string;
  workplaceId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string | null;
  role?: string;
  permissions?: string[];
  iss?: string;
  aud?: string | string[];
}

export function verifyPlatformLaunchToken(rawToken: string): PlatformJwtPayload {
  const secret = getSharedJwtSecret();

  let decoded: PlatformJwtPayload;
  try {
    decoded = jwt.verify(rawToken, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE_TEAM_CHAT,
      algorithms: ['HS256'],
    }) as PlatformJwtPayload;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    throw new UnauthorizedException(`Invalid or expired launch token: ${message}`);
  }

  return decoded;
}

export function requestUserFromPlatformJwt(decoded: PlatformJwtPayload): RequestUser {
  const userId = decoded.userId || decoded.sub || decoded.id;
  const workplaceId = decoded.workspaceId || decoded.workplaceId;
  const role = decoded.role || 'member';
  const permissions = mapPlatformPermissions(decoded.permissions, role);

  if (!userId || !workplaceId) {
    throw new UnauthorizedException(
      'Invalid launch token payload: missing userId or workspaceId',
    );
  }

  return {
    userId,
    id: userId,
    workplaceId,
    role,
    permissions,
  };
}

export function profileFromPlatformJwt(decoded: PlatformJwtPayload, userId: string) {
  return {
    email: decoded.email || `${userId}@workplace.local`,
    name: decoded.name || 'Workplace User',
    avatarUrl: decoded.avatarUrl ?? null,
  };
}
