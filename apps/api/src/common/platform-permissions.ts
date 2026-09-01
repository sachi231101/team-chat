import { DEFAULT_PERMISSIONS } from './request-user';

const PLATFORM_TO_TEAM_CHAT: Record<string, string[]> = {
  'channels.view': ['channel:read', 'chat:read'],
  'channels.create': ['channel:create'],
  'channels.manage': ['channel:create', 'channel:read', 'chat:read', 'chat:write'],
  'messages.view': ['chat:read', 'conversation:read'],
  'messages.send': ['chat:write', 'conversation:write'],
  'messages.delete': ['chat:write'],
};

const ADMIN_ROLES = new Set([
  'ORG_OWNER',
  'ORG_ADMIN',
  'WS_ADMIN',
  'OWNER',
  'ADMIN',
  'TEAM_ADMIN',
]);

const GUEST_READ_ONLY = [
  'chat:read',
  'channel:read',
  'conversation:read',
];

/**
 * Maps Workplace Platform RBAC permission keys to Team Chat permission strings.
 */
export function mapPlatformPermissions(
  platformPermissions: string[] | undefined,
  role?: string,
): string[] {
  if (role && ADMIN_ROLES.has(role.toUpperCase())) {
    return [...DEFAULT_PERMISSIONS];
  }

  if (role?.toUpperCase() === 'GUEST') {
    return [...GUEST_READ_ONLY];
  }

  if (!platformPermissions?.length) {
    return [...DEFAULT_PERMISSIONS];
  }

  const mapped = new Set<string>();
  for (const perm of platformPermissions) {
    const teamChatPerms = PLATFORM_TO_TEAM_CHAT[perm];
    if (teamChatPerms) {
      teamChatPerms.forEach((p) => mapped.add(p));
    }
  }

  if (mapped.size === 0) {
    return [...DEFAULT_PERMISSIONS];
  }

  return Array.from(mapped);
}
