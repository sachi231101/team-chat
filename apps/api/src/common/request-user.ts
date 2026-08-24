export const DEFAULT_MOCK_USER_ID = 'usr-rahul';
export const DEFAULT_WORKPLACE_ID = 'wp-teamchat-main';

export interface RequestUser {
  id: string;
  workplaceId: string;
}

export function readUserFromHeaders(headers: Record<string, unknown> | undefined): RequestUser {
  const rawUser = headers?.['x-user-id'];
  const rawWorkplace = headers?.['x-workplace-id'];
  const userId = Array.isArray(rawUser) ? rawUser[0] : rawUser;
  const workplaceId = Array.isArray(rawWorkplace) ? rawWorkplace[0] : rawWorkplace;

  return {
    id: typeof userId === 'string' && userId.trim() ? userId : DEFAULT_MOCK_USER_ID,
    workplaceId:
      typeof workplaceId === 'string' && workplaceId.trim()
        ? workplaceId
        : DEFAULT_WORKPLACE_ID,
  };
}
