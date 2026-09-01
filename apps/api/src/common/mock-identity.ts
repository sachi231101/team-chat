import { Logger } from '@nestjs/common';
import {
  DEFAULT_MOCK_USER_ID,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE,
  DEFAULT_WORKPLACE_ID,
  type RequestUser,
} from './request-user';
import {
  profileFromPlatformJwt,
  requestUserFromPlatformJwt,
  verifyPlatformLaunchToken,
} from './platform-jwt';
import { isMockIdentityAllowed } from './jwt-config';

/**
 * TEMPORARY mock identity provider for Team Chat development.
 * Disabled in production unless ALLOW_MOCK_IDENTITY=true.
 */
const logger = new Logger('MockIdentity');
let warnedOnce = false;

export { isMockIdentityAllowed };

function warnIfProductionMock(): void {
  if (warnedOnce) return;
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_IDENTITY === 'true') {
    warnedOnce = true;
    logger.warn(
      'ALLOW_MOCK_IDENTITY=true in production — header-based identity is enabled for controlled staging only.',
    );
  }
}

export function resolveMockIdentityFromHeaders(
  headers: Record<string, unknown> | undefined,
): RequestUser {
  if (!isMockIdentityAllowed()) {
    throw new Error('Mock identity headers are disabled');
  }

  warnIfProductionMock();

  const rawUser = headers?.['x-user-id'];
  const rawWorkplace = headers?.['x-workplace-id'];
  const rawRole = headers?.['x-user-role'];
  const rawPermissions = headers?.['x-user-permissions'];

  const userIdVal = Array.isArray(rawUser) ? rawUser[0] : rawUser;
  const workplaceIdVal = Array.isArray(rawWorkplace) ? rawWorkplace[0] : rawWorkplace;
  const roleVal = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const permissionsVal = Array.isArray(rawPermissions) ? rawPermissions[0] : rawPermissions;

  const finalUserId =
    typeof userIdVal === 'string' && userIdVal.trim()
      ? userIdVal.trim()
      : DEFAULT_MOCK_USER_ID;

  const finalWorkplaceId =
    typeof workplaceIdVal === 'string' && workplaceIdVal.trim()
      ? workplaceIdVal.trim()
      : DEFAULT_WORKPLACE_ID;

  const finalRole =
    typeof roleVal === 'string' && roleVal.trim()
      ? roleVal.trim()
      : DEFAULT_ROLE;

  let finalPermissions: string[] = DEFAULT_PERMISSIONS;
  if (typeof permissionsVal === 'string' && permissionsVal.trim()) {
    finalPermissions = permissionsVal
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return {
    userId: finalUserId,
    id: finalUserId,
    workplaceId: finalWorkplaceId,
    role: finalRole,
    permissions: finalPermissions,
  };
}

function resolveIdentityFromToken(token: string): RequestUser | null {
  try {
    const decoded = verifyPlatformLaunchToken(token);
    return requestUserFromPlatformJwt(decoded);
  } catch {
    return null;
  }
}

export function resolveIdentityFromHandshake(input: {
  authToken?: unknown;
  authUserId?: unknown;
  authWorkplaceId?: unknown;
  headers?: Record<string, unknown>;
}): RequestUser {
  const token =
    (typeof input.authToken === 'string' && input.authToken.trim()) ||
    (typeof input.headers?.authorization === 'string' && input.headers.authorization.startsWith('Bearer ')
      ? input.headers.authorization.slice(7).trim()
      : undefined);

  if (token) {
    const fromJwt = resolveIdentityFromToken(token);
    if (fromJwt) {
      return fromJwt;
    }
    if (!isMockIdentityAllowed()) {
      throw new Error('Invalid launch token');
    }
  }

  if (!isMockIdentityAllowed()) {
    throw new Error('Authentication token required');
  }

  return resolveMockIdentityFromHandshake(input);
}

export function resolveMockIdentityFromHandshake(input: {
  authUserId?: unknown;
  authWorkplaceId?: unknown;
  headers?: Record<string, unknown>;
}): RequestUser {
  if (!isMockIdentityAllowed()) {
    throw new Error('Mock identity is disabled');
  }

  warnIfProductionMock();

  const fromAuthUser =
    typeof input.authUserId === 'string' && input.authUserId.trim()
      ? input.authUserId.trim()
      : undefined;
  const fromAuthWp =
    typeof input.authWorkplaceId === 'string' && input.authWorkplaceId.trim()
      ? input.authWorkplaceId.trim()
      : undefined;

  if (fromAuthUser || fromAuthWp) {
    const headerFallback = resolveMockIdentityFromHeaders(input.headers);
    return {
      userId: fromAuthUser || headerFallback.userId,
      id: fromAuthUser || headerFallback.userId,
      workplaceId: fromAuthWp || headerFallback.workplaceId,
      role: headerFallback.role,
      permissions: headerFallback.permissions,
    };
  }

  return resolveMockIdentityFromHeaders(input.headers);
}

function mergeQueryIdentityHeaders(req: {
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
}): Record<string, unknown> | undefined {
  if (!isMockIdentityAllowed()) {
    return req.headers;
  }

  const headers: Record<string, unknown> = { ...(req.headers || {}) };
  const query = req.query || {};
  if (!headers['x-user-id'] && query['x-user-id']) {
    headers['x-user-id'] = query['x-user-id'];
  }
  if (!headers['x-workplace-id'] && query['x-workplace-id']) {
    headers['x-workplace-id'] = query['x-workplace-id'];
  }
  return headers;
}

/** Attach / normalize identity on an HTTP request object. */
export function attachMockIdentity(req: {
  user?: Partial<RequestUser> & { id?: string; userId?: string };
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
}): RequestUser {
  if (req.user?.userId || req.user?.id) {
    const uid = (req.user.userId || req.user.id) as string;
    const user: RequestUser = {
      userId: uid,
      id: uid,
      workplaceId: req.user.workplaceId as string,
      role: req.user.role || DEFAULT_ROLE,
      permissions: req.user.permissions || DEFAULT_PERMISSIONS,
    };
    req.user = user;
    return user;
  }

  if (!isMockIdentityAllowed()) {
    throw new Error('Authentication required');
  }

  req.headers = mergeQueryIdentityHeaders(req);
  const user = resolveMockIdentityFromHeaders(req.headers);
  req.user = user;
  return user;
}

/** @deprecated Prefer resolveMockIdentityFromHeaders. */
export const readUserFromHeaders = resolveMockIdentityFromHeaders;
