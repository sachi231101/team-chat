import { apiClient } from './apiClient';
import { Channel, Conversation, Message, User, NotificationItem } from '@team-chat/shared';

export const chatService = {
  // Users
  getUsers: () => apiClient<User[]>('/users'),
  getUser: (id: string) => apiClient<User>(`/users/${id}`),
  createUser: (data: { name: string; email: string; avatarUrl?: string; title?: string; status?: string; statusMessage?: string }) =>
    apiClient<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUserProfile: (id: string, data: { name?: string; email?: string; avatarUrl?: string; title?: string; status?: string; statusMessage?: string }) =>
    apiClient<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: 'online' | 'busy' | 'away' | 'offline', statusMessage?: string) =>
    apiClient<User>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, statusMessage }),
    }),

  // Channels
  getChannels: () => apiClient<Channel[]>('/channels'),
  getChannel: (id: string) => apiClient<Channel>(`/channels/${id}`),
  createChannel: (data: { name: string; description?: string; topic?: string; type: 'public' | 'private'; createdById: string; workplaceId?: string }) =>
    apiClient<Channel>('/channels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Channel Members
  getChannelMembers: (channelId: string) =>
    apiClient<User[]>(`/channels/${channelId}/members`),
  addChannelMembers: (channelId: string, userIds: string[]) =>
    apiClient<User[]>(`/channels/${channelId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    }),
  removeChannelMember: (channelId: string, userId: string) =>
    apiClient<{ success: boolean }>(`/channels/${channelId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Conversations
  getConversations: () => apiClient<Conversation[]>('/conversations'),
  getConversation: (id: string) => apiClient<Conversation>(`/conversations/${id}`),
  createConversation: (participants: string[], workplaceId?: string) =>
    apiClient<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participants, workplaceId }),
    }),

  // Messages
  getMessages: (channelId?: string, conversationId?: string, limit?: number, cursor?: string) => {
    const params = new URLSearchParams();
    if (channelId) params.append('channelId', channelId);
    if (conversationId) params.append('conversationId', conversationId);
    if (limit) params.append('limit', String(limit));
    if (cursor) params.append('cursor', cursor);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Message[]>(`/messages${qs}`);
  },
  getMessage: (id: string) => apiClient<Message>(`/messages/${id}`),
  sendMessage: (data: Partial<Message> & { content: string; senderId: string; senderName: string }) =>
    apiClient<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  editMessage: (id: string, content: string) =>
    apiClient<Message>(`/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  deleteMessage: (id: string) =>
    apiClient<{ success: boolean }>(`/messages/${id}`, {
      method: 'DELETE',
    }),
  togglePin: (id: string) =>
    apiClient<Message>(`/messages/${id}/pin`, {
      method: 'PATCH',
    }),
  toggleReaction: (messageId: string, emoji: string, userId: string, userName: string) =>
    apiClient<Message>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji, userId, userName }),
    }),
  getThreadReplies: (parentMessageId: string) =>
    apiClient<Message[]>(`/messages/${parentMessageId}/replies`),
  markMessageAsRead: (messageId: string) =>
    apiClient<{ success: boolean }>(`/messages/${messageId}/read`, {
      method: 'POST',
    }),
  summarizeThread: (messageId: string) =>
    apiClient<{
      summary: string;
      decisions: string[];
      openQuestions: string[];
      actionItems: { owner: string; task: string }[];
      blockers: string[];
    }>(`/messages/${messageId}/summarize`, {
      method: 'POST',
    }),

  // Notifications
  getNotifications: () => apiClient<NotificationItem[]>('/notifications'),
  markNotificationAsRead: (id: string) =>
    apiClient<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsAsRead: () =>
    apiClient<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    }),

  // Search
  search: (query: string) =>
    apiClient<{ messages: Message[]; channels: Channel[]; users: User[] }>(`/search?q=${encodeURIComponent(query)}`),
};
