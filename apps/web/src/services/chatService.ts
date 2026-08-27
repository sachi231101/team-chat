import { apiClient } from './apiClient';
import {
  Channel,
  Conversation,
  Message,
  User,
  NotificationItem,
  ActionItem,
  CreateActionItemDto,
  UpdateActionItemDto,
  MessageTag,
  MessageTagType,
  WorkExtractionResult,
  DailyBriefingData,
  AiTeammateInfo,
  AiTaskProgressUpdate,
  MultiAgentCoordinationResult,
  SmartRouteSuggestion,
  DecisionRecord,
  DecisionStatus,
  AiCorrection,
  AiLearningRule,
  Poll,
} from '@team-chat/shared';


export interface MessageListResponse {
  items: Message[];
  nextCursor: string | null;
  lastReadMessageId: string | null;
}

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
  createChannel: (data: { name: string; description?: string; topic?: string; type: 'public' | 'private' }) =>
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
    return apiClient<MessageListResponse>(`/messages${qs}`);
  },
  syncMessages: (channelId?: string, conversationId?: string, since?: string) => {
    const params = new URLSearchParams();
    if (channelId) params.append('channelId', channelId);
    if (conversationId) params.append('conversationId', conversationId);
    if (since) params.append('since', since);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Message[]>(`/messages/sync${qs}`);
  },
  getPinnedMessages: (channelId?: string, conversationId?: string) => {
    const params = new URLSearchParams();
    if (channelId) params.append('channelId', channelId);
    if (conversationId) params.append('conversationId', conversationId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Message[]>(`/messages/pinned${qs}`);
  },
  getMessage: (id: string) => apiClient<Message>(`/messages/${id}`),
  sendMessage: (data: {
    clientMessageId?: string;
    content: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    scheduledFor?: string;
    attachments?: { name: string; url: string; size: number; type: string }[];
  }) =>
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
  toggleReaction: (messageId: string, emoji: string) =>
    apiClient<Message>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
  getThreadReplies: (parentMessageId: string) =>
    apiClient<Message[]>(`/messages/${parentMessageId}/replies`),
  markMessageAsRead: (messageId: string) =>
    apiClient<{ success: boolean }>(`/messages/${messageId}/read`, {
      method: 'POST',
    }),

  getSavedMessageIds: () => apiClient<string[]>('/saved-messages/ids'),
  getSavedMessages: () => apiClient<Message[]>('/saved-messages'),
  toggleSavedMessage: (messageId: string) =>
    apiClient<{ saved: boolean; ids: string[] }>('/saved-messages', {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    }),

  // Action Items (Pillar 5)
  getActionItems: (params?: {
    channelId?: string;
    conversationId?: string;
    assigneeId?: string;
    status?: string;
    messageId?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.channelId) qs.append('channelId', params.channelId);
    if (params?.conversationId) qs.append('conversationId', params.conversationId);
    if (params?.assigneeId) qs.append('assigneeId', params.assigneeId);
    if (params?.status) qs.append('status', params.status);
    if (params?.messageId) qs.append('messageId', params.messageId);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient<ActionItem[]>(`/chat/actions${queryString}`);
  },
  createActionItem: (data: CreateActionItemDto) =>
    apiClient<ActionItem>('/chat/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateActionItem: (id: string, data: UpdateActionItemDto) =>
    apiClient<ActionItem>(`/chat/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteActionItem: (id: string) =>
    apiClient<{ success: boolean }>(`/chat/actions/${id}`, {
      method: 'DELETE',
    }),

  // Message Tags & Decisions (Pillar 4)
  toggleMessageTag: (
    messageId: string,
    data: { tag: MessageTagType; note?: string },
  ) =>
    apiClient<{ added: boolean; tag?: MessageTag; message: Message }>(
      `/chat/tags/${messageId}/toggle`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getDecisions: (params?: { channelId?: string; conversationId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.channelId) qs.append('channelId', params.channelId);
    if (params?.conversationId) qs.append('conversationId', params.conversationId);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient<Message[]>(`/chat/tags/decisions${queryString}`);
  },

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
  search: (query: string, scope: 'all' | 'channels' | 'people' | 'messages' = 'all') =>
    apiClient<{
      messages: Message[];
      channels: Channel[];
      users: User[];
      scope?: string;
    }>(`/search?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`),

  getAiStatus: () =>
    apiClient<{ enabled: boolean; provider: string; model: string; configured: boolean }>('/ai/status'),
  composeWithAi: (data: {
    action: 'improve' | 'shorten' | 'expand' | 'translate' | 'summarize' | 'casual' | 'exec';
    text: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
  }) =>
    apiClient<{ text: string }>('/ai/compose', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  askAi: (data: { question: string; channelId?: string; conversationId?: string }) =>
    apiClient<{
      answer: string;
      citations: {
        index: number;
        messageId: string;
        senderName: string;
        content: string;
        channelId?: string;
        conversationId?: string;
        createdAt: string;
      }[];
    }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  summarizeWithAi: (data: {
    window: 'unread' | '24h' | '7d';
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    postAsMessage?: boolean;
    pin?: boolean;
  }) =>
    apiClient<{
      summary: string;
      postedMessageId?: string;
      citations: {
        index: number;
        messageId: string;
        senderName: string;
        content: string;
        channelId?: string;
        conversationId?: string;
        createdAt: string;
      }[];
    }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recapWithAi: () =>
    apiClient<{
      recap: string;
      citations: {
        index: number;
        messageId: string;
        senderName: string;
        content: string;
        channelId?: string;
        conversationId?: string;
        createdAt: string;
      }[];
    }>('/ai/recap', { method: 'POST' }),
  meetingNotesWithAi: (data: {
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    transcript?: string;
    postAsMessage?: boolean;
  }) =>
    apiClient<{ notes: string; postedMessageId?: string }>('/ai/meeting-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  summarizeFileWithAi: (data: { name: string; url?: string; type?: string }) =>
    apiClient<{ summary: string }>('/ai/summarize-file', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── AI ADVANTAGES ──────────────────────────────────────────
  extractWorkWithAi: (data: {
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    messageId?: string;
    transcript?: string;
    text?: string;
  }) =>
    apiClient<WorkExtractionResult>('/ai/extract-work', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  applyWorkWithAi: (data: {
    channelId?: string;
    conversationId?: string;
    messageId?: string;
    tasks?: Array<{
      title: string;
      description?: string;
      assigneeId?: string;
      dueDate?: string;
      status?: string;
    }>;
    decisions?: Array<{
      title: string;
      rationale?: string;
      impactedAreas?: string[];
    }>;
  }) =>
    apiClient<{
      success: boolean;
      createdTaskCount: number;
      createdDecisionCount: number;
      tasks: ActionItem[];
      decisions: any[];
    }>('/ai/apply-work', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDailyBriefing: (timeframe?: 'today' | '24h' | '7d') => {
    const qs = timeframe ? `?timeframe=${timeframe}` : '';
    return apiClient<DailyBriefingData>(`/ai/briefing${qs}`);
  },

  generateDailyBriefing: (timeframe: 'today' | '24h' | '7d' = '24h') =>
    apiClient<DailyBriefingData>('/ai/briefing/generate', {
      method: 'POST',
      body: JSON.stringify({ timeframe }),
    }),

  getAiTeammates: () => apiClient<AiTeammateInfo[]>('/ai/teammates'),

  executeAgentTask: (actionItemId: string) =>
    apiClient<AiTaskProgressUpdate>('/ai/agents/execute-task', {
      method: 'POST',
      body: JSON.stringify({ actionItemId }),
    }),

  getAgentTaskProgress: (actionItemId: string) =>
    apiClient<AiTaskProgressUpdate>(`/ai/agents/task-progress/${actionItemId}`),

  coordinateMultiAgent: (data: {
    objective: string;
    participatingAgents?: string[];
    channelId?: string;
    conversationId?: string;
  }) =>
    apiClient<MultiAgentCoordinationResult>('/ai/coordinate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  smartRouteWithAi: (data: { text: string; currentChannelId?: string }) =>
    apiClient<SmartRouteSuggestion>('/ai/smart-route', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAiDecisions: (params?: { channelId?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.channelId) qs.append('channelId', params.channelId);
    if (params?.status) qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient<DecisionRecord[]>(`/ai/decisions${queryString}`);
  },

  createAiDecision: (data: {
    title: string;
    rationale?: string;
    channelId?: string;
    messageId?: string;
    status?: DecisionStatus;
    impactedAreas?: string[];
  }) =>
    apiClient<DecisionRecord>('/ai/decisions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAiDecision: (
    id: string,
    data: {
      title?: string;
      rationale?: string;
      status?: DecisionStatus;
      impactedAreas?: string[];
    },
  ) =>
    apiClient<DecisionRecord>(`/ai/decisions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAiDecision: (id: string) =>
    apiClient<{ success: boolean }>(`/ai/decisions/${id}`, {
      method: 'DELETE',
    }),

  detectDecisionsWithAi: (data: {
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    transcript?: string;
  }) =>
    apiClient<{ decisions: any[] }>('/ai/decisions/detect', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordAiCorrection: (data: {
    agentId?: string;
    category?: string;
    originalText: string;
    correctedText: string;
    instruction?: string;
  }) =>
    apiClient<{ success: boolean; correctionId: string }>('/ai/corrections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAiRules: () => apiClient<AiLearningRule[]>('/ai/rules'),

  createAiRule: (data: { rule: string; category?: string }) =>
    apiClient<AiLearningRule>('/ai/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleAiRule: (id: string, active: boolean) =>
    apiClient<AiLearningRule>(`/ai/rules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  deleteAiRule: (id: string) =>
    apiClient<{ success: boolean }>(`/ai/rules/${id}`, {
      method: 'DELETE',
    }),

  // Polls
  createPoll: (data: {
    question: string;
    options: string[];
    isMultiChoice?: boolean;
    isAnonymous?: boolean;
    channelId?: string;
    conversationId?: string;
  }) =>
    apiClient<Poll>('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPoll: (id: string) => apiClient<Poll>(`/polls/${id}`),

  votePoll: (pollId: string, optionIndex: number) =>
    apiClient<Poll>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex }),
    }),

  closePoll: (pollId: string, isClosed = true) =>
    apiClient<Poll>(`/polls/${pollId}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ isClosed }),
    }),

  uploadAttachment: async (file: File) => {

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE_URL}/attachments/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': localStorage.getItem('team_chat_user_id') || 'usr-rahul',
        'x-workplace-id': 'wp-teamchat-main',
      },
      body: form,
    });
    if (!response.ok) {
      let message = 'Failed to upload file';
      try {
        const body = await response.json();
        message = body?.message ?? body?.error ?? message;
        if (Array.isArray(message)) message = message.join(', ');
      } catch {
        if (response.status === 413) message = 'File is too large (max 50 MB)';
      }
      throw new Error(message);
    }
    return response.json() as Promise<{ name: string; size: number; type: string; url: string }>;
  },
};
