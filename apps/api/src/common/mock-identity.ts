import { Logger } from '@nestjs/common';
import {
  DEFAULT_MOCK_USER_ID,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE,
  DEFAULT_WORKPLACE_ID,
  type RequestUser,
} from './request-user';

/**
 * TEMPORARY mock identity provider for Team Chat development.
 *
 * Identity is derived from trusted Workplace auth in production later.
 * Until then, development uses `x-user-id` / `x-workplace-id` headers
 * (and Socket.IO handshake auth) as a stand-in only.
 *
 * Replace this module with Workplace JWT / session verification —
 * do not spread header trust into new call sites.
 */
const logger = new Logger('MockIdentity');
let warnedOnce = false;

function warnIfProductionMock(): void {
  if (warnedOnce) return;
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_IDENTITY !== 'true') {
    warnedOnce = true;
    logger.warn(
      'Using temporary mock identity (header-based). Set ALLOW_MOCK_IDENTITY=true only for controlled staging; replace with Workplace auth before public launch.',
    );
  }
}

export function resolveMockIdentityFromHeaders(
  headers: Record<string, unknown> | undefined,
): RequestUser {
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

export function resolveMockIdentityFromHandshake(input: {
  authUserId?: unknown;
  authWorkplaceId?: unknown;
  headers?: Record<string, unknown>;
}): RequestUser {
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
  req.headers = mergeQueryIdentityHeaders(req);

  if (req.user?.userId || req.user?.id) {
    const uid = (req.user.userId || req.user.id) as string;
    const headerFallback = resolveMockIdentityFromHeaders(req.headers);
    const user: RequestUser = {
      userId: uid,
      id: uid,
      workplaceId: req.user.workplaceId || headerFallback.workplaceId,
      role: req.user.role || headerFallback.role,
      permissions: req.user.permissions || headerFallback.permissions,
    };
    req.user = user;
    return user;
  }

  const user = resolveMockIdentityFromHeaders(req.headers);
  req.user = user;
  return user;
}

/** @deprecated Prefer resolveMockIdentityFromHeaders. */
export const readUserFromHeaders = resolveMockIdentityFromHeaders;
