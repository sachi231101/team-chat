export const queryKeys = {
  users: ['users'] as const,
  channels: ['channels'] as const,
  conversations: ['conversations'] as const,
  notifications: ['notifications'] as const,
  savedIds: ['saved-message-ids'] as const,
  savedMessages: ['saved-messages'] as const,
  messages: (type: string, id: string) => ['messages', type, id] as const,
  pinned: (type: string, id: string) => ['pinned', type, id] as const,
  actions: (type: string, id: string) => ['actions', type, id] as const,
  decisions: (type: string, id: string) => ['decisions', type, id] as const,
};
