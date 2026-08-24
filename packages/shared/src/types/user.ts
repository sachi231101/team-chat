export type UserStatus = 'online' | 'busy' | 'away' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  status: UserStatus;
  statusMessage?: string;
  workplaceId: string;
  createdAt: string;
}
