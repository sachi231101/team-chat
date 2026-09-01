export const DEFAULT_MOCK_USER_ID = 'usr-dev-rahul';
export const DEFAULT_WORKPLACE_ID = 'ws-acme-hq-dev';
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
