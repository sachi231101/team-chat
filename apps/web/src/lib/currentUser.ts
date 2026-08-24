import { User } from '@team-chat/shared';

export const DEFAULT_CURRENT_USER: User = {
  id: 'usr-rahul',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@teamchat.io',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  title: 'Lead Staff Engineer',
  status: 'online',
  statusMessage: 'Architecting Team Chat',
  workplaceId: 'wp-teamchat-main',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export function getStoredUserId(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENT_USER.id;
  return localStorage.getItem('team_chat_user_id') || DEFAULT_CURRENT_USER.id;
}

export function setStoredUserId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('team_chat_user_id', id);
  }
}
