import { Conversation } from '@team-chat/shared';

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'dm-priya',
    participants: ['usr-rahul', 'usr-priya'],
    workplaceId: 'wp-teamchat-main',
    unreadCount: 1,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-04T14:20:00.000Z',
  },
  {
    id: 'dm-arjun',
    participants: ['usr-rahul', 'usr-arjun'],
    workplaceId: 'wp-teamchat-main',
    unreadCount: 0,
    createdAt: '2026-01-01T10:30:00.000Z',
    updatedAt: '2026-01-04T13:45:00.000Z',
  },
  {
    id: 'dm-sachin',
    participants: ['usr-rahul', 'usr-sachin'],
    workplaceId: 'wp-teamchat-main',
    unreadCount: 0,
    createdAt: '2026-01-02T11:00:00.000Z',
    updatedAt: '2026-01-03T16:10:00.000Z',
  },
  {
    id: 'dm-ananya',
    participants: ['usr-rahul', 'usr-ananya'],
    workplaceId: 'wp-teamchat-main',
    unreadCount: 0,
    createdAt: '2026-01-03T09:00:00.000Z',
    updatedAt: '2026-01-04T11:20:00.000Z',
  },
];
