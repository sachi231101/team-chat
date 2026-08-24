export const APP_CONFIG = {
  appName: 'Team Chat',
  version: '1.0.0',
  defaultPort: 3000,
  defaultWsPort: 3000,
  maxMessageLength: 4000,
  maxAttachmentSizeBytes: 25 * 1024 * 1024, // 25MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  socketEvents: {
    JOIN_CHANNEL: 'channel:join',
    LEAVE_CHANNEL: 'channel:leave',
    NEW_MESSAGE: 'message:new',
    UPDATE_MESSAGE: 'message:update',
    DELETE_MESSAGE: 'message:delete',
    MESSAGE_REACTION: 'message:reaction',
    USER_TYPING: 'user:typing',
    PRESENCE_UPDATE: 'presence:update',
    NOTIFICATION_NEW: 'notification:new',
  },
} as const;
