export const DEFAULT_MOCK_USER_ID = 'usr-rahul';
export const DEFAULT_WORKPLACE_ID = 'wp-teamchat-main';
export const DEFAULT_ROLE = 'member';
export const DEFAULT_PERMISSIONS = [
  'chat:read',
  'chat:write',
  'channel:create',
  'channel:read',
  'conversation:read',
  'conversation:write',
];

export interface RequestUser {
  userId: string;
  id: string; // alias for userId for backward compatibility
  workplaceId: string;
  role: string;
  permissions: string[];
}

export function readUserFromHeaders(headers: Record<string, unknown> | undefined): RequestUser {
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

export function normalizeUser(partial: {
  id?: string;
  userId?: string;
  workplaceId?: string;
  role?: string;
  permissions?: string[];
}): RequestUser {
  const finalUserId = partial.userId || partial.id || DEFAULT_MOCK_USER_ID;
  const finalWorkplaceId = partial.workplaceId || DEFAULT_WORKPLACE_ID;
  return {
    userId: finalUserId,
    id: finalUserId,
    workplaceId: finalWorkplaceId,
    role: partial.role || DEFAULT_ROLE,
    permissions: partial.permissions || DEFAULT_PERMISSIONS,
  };
}



