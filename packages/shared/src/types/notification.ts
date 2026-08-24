export type NotificationType = 'mention' | 'reply' | 'reaction' | 'direct_message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: 'mention' | 'reply' | 'reaction' | 'dm';
  channelId?: string;
}

