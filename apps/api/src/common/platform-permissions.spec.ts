import { mapPlatformPermissions } from './platform-permissions';
import { DEFAULT_PERMISSIONS } from './request-user';

describe('mapPlatformPermissions', () => {
  it('maps platform channel and message permissions to team chat permissions', () => {
    const result = mapPlatformPermissions([
      'channels.view',
      'channels.create',
      'messages.view',
      'messages.send',
    ]);

    expect(result).toContain('chat:read');
    expect(result).toContain('channel:read');
    expect(result).toContain('channel:create');
    expect(result).toContain('chat:write');
    expect(result).toContain('conversation:read');
    expect(result).toContain('conversation:write');
  });

  it('grants full permissions for admin roles', () => {
    const result = mapPlatformPermissions([], 'WS_ADMIN');
    expect(result).toEqual(expect.arrayContaining([...DEFAULT_PERMISSIONS]));
  });

  it('grants read-only permissions for guest role', () => {
    const result = mapPlatformPermissions([], 'GUEST');
    expect(result).toContain('chat:read');
    expect(result).not.toContain('chat:write');
    expect(result).not.toContain('channel:create');
  });

  it('falls back to defaults when no platform permissions match', () => {
    const result = mapPlatformPermissions(['organization.view']);
    expect(result).toEqual([...DEFAULT_PERMISSIONS]);
  });
});
