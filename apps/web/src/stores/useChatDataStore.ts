import { create } from 'zustand';
import { User, Channel, Conversation, Message, UserStatus, NotificationItem } from '@team-chat/shared';
import { chatService, socketService } from '../services';

export interface SharedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  channelId?: string;
}

const DEFAULT_CURRENT_USER: User = {
  id: 'usr-rahul',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@teamchat.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  title: 'Lead Staff Engineer',
  status: 'online',
  statusMessage: 'Architecting Team Chat 🚀',
  workplaceId: 'wp-teamchat-main',
  createdAt: '2026-01-01T00:00:00.000Z',
};

interface ChatDataState {
  // Loading & connection state
  isConnected: boolean;
  isLoading: boolean;
  messagesLoading: boolean;
  error: string | null;
  clearError: () => void;
  initStore: () => Promise<void>;

  // Current user
  currentUser: User;
  setCurrentUser: (user: User) => void;
  setCurrentUserStatus: (status: UserStatus, statusMessage?: string) => Promise<void>;
  updateCurrentUserProfile: (name: string, title: string, email: string, avatarUrl?: string) => Promise<void>;
  createNewUser: (data: { name: string; email: string; avatarUrl?: string; title?: string }) => Promise<User>;

  // Users
  users: User[];

  // Active rail tab
  activeRailTab: 'home' | 'dms' | 'activity' | 'files' | 'later';
  setActiveRailTab: (tab: 'home' | 'dms' | 'activity' | 'files' | 'later') => void;

  // Channels & Conversations
  channels: Channel[];
  conversations: Conversation[];
  activeId: string;
  activeType: 'channel' | 'conversation';
  setActiveChannel: (channelId: string) => void;
  setActiveConversation: (conversationId: string) => void;
  createChannel: (name: string, description: string, topic: string, type: 'public' | 'private') => Promise<string>;
  createConversation: (userId: string) => Promise<string>;

  // Typing indicator
  typingUsers: { userId: string; userName: string; channelId?: string; conversationId?: string }[];
  sendTypingIndicator: (isTyping: boolean) => void;

  // Messages & Saved Items
  messages: Message[];
  savedMessageIds: string[];
  toggleSaveMessage: (messageId: string) => void;
  loadMessages: (channelId?: string, conversationId?: string) => Promise<void>;
  sendMessage: (content: string, attachments?: { name: string; url: string; size: number; type: string }[]) => Promise<void>;
  sendThreadReply: (parentMessageId: string, content: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePin: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;

  // Files
  files: SharedFileItem[];
  addFile: (file: SharedFileItem) => void;

  // Threads
  activeThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;

  // Details Panel
  detailsPanelOpen: boolean;
  detailsTab: 'about' | 'members' | 'files' | 'pinned';
  toggleDetailsPanel: () => void;
  setDetailsTab: (tab: 'about' | 'members' | 'files' | 'pinned') => void;

  // Modals & Navigation
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  createChannelModalOpen: boolean;
  setCreateChannelModalOpen: (open: boolean) => void;
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  peopleModalOpen: boolean;
  setPeopleModalOpen: (open: boolean) => void;
  taskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  approvalModalOpen: boolean;
  setApprovalModalOpen: (open: boolean) => void;
  actionTargetMessage: Message | null;
  openCreateTaskModal: (message: Message) => void;
  openCreateApprovalModal: (message: Message) => void;

  // Decisions Log
  savedDecisions: { id: string; messageId: string; title: string; tags: string[]; createdAt: string }[];
  saveAsDecision: (messageId: string, title?: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // App Settings
  theme: 'dark' | 'slate' | 'light';
  setTheme: (theme: 'dark' | 'slate' | 'light') => void;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useChatDataStore = create<ChatDataState>((set, get) => {
  let isInitialized = false;

  return {
    isConnected: false,
    isLoading: true,
    messagesLoading: false,
    error: null,
    clearError: () => set({ error: null }),
    currentUser: DEFAULT_CURRENT_USER,
    users: [DEFAULT_CURRENT_USER],
    channels: [],
    conversations: [],
    messages: [],
    savedMessageIds: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('team_chat_saved_ids') || '[]') : [],
    toggleSaveMessage: (messageId: string) => {
      set((state) => {
        const exists = state.savedMessageIds.includes(messageId);
        const updated = exists
          ? state.savedMessageIds.filter((id) => id !== messageId)
          : [...state.savedMessageIds, messageId];
        if (typeof window !== 'undefined') {
          localStorage.setItem('team_chat_saved_ids', JSON.stringify(updated));
        }
        return { savedMessageIds: updated };
      });
    },
    files: [],
    notifications: [],
    activeRailTab: 'home',
    setActiveRailTab: (tab) => {
      if (tab === 'dms') {
        const convos = get().conversations;
        const currentActiveType = get().activeType;
        if (currentActiveType !== 'conversation' && convos.length > 0) {
          get().setActiveConversation(convos[0].id);
        }
      }
      set({ activeRailTab: tab });
    },
    activeId: '',
    activeType: 'channel',
    activeThreadId: null,
    detailsPanelOpen: true,
    detailsTab: 'about',
    searchModalOpen: false,
    createChannelModalOpen: false,
    inviteModalOpen: false,
    profileModalOpen: false,
    settingsModalOpen: false,
    peopleModalOpen: false,
    theme: 'dark',
    density: 'comfortable',
    soundEnabled: true,

    initStore: async () => {
      if (isInitialized) return;
      isInitialized = true;

      try {
        set({ isLoading: true, error: null });

        // Connect Socket.IO
        socketService.connect();
        set({ isConnected: true });

        // Fetch initial data (no messages yet — load per context)
        const [users, channels, conversations, notifications] = await Promise.all([
          chatService.getUsers().catch(() => [DEFAULT_CURRENT_USER]),
          chatService.getChannels().catch(() => []),
          chatService.getConversations().catch(() => []),
          chatService.getNotifications().catch(() => []),
        ]);

        // Persist user ID to localStorage so apiClient picks it up for headers
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('team_chat_user_id') : null;
        const myUser =
          (savedUserId && users.find((u) => u.id === savedUserId)) ||
          users.find((u) => u.id === 'usr-rahul') ||
          users[0] ||
          DEFAULT_CURRENT_USER;

        if (typeof window !== 'undefined') {
          localStorage.setItem('team_chat_user_id', myUser.id);
        }

        const defaultChannelId = channels[0]?.id || '';

        set({
          users,
          channels,
          conversations,
          notifications,
          currentUser: myUser,
          activeId: defaultChannelId,
          activeType: 'channel',
          isLoading: false,
        });

        // Join initial channel room and load its messages
        if (defaultChannelId) {
          socketService.joinChannel(defaultChannelId);
          await get().loadMessages(defaultChannelId, undefined);
        }

        // ── Real-time event listeners ──────────────────────────────────────
        // message:channel / message:conversation come from targeted room broadcasts.
        // message:created is the global broadcast — we deduplicate by ID.
        socketService.onMessageCreated((newMsg) => {
          set((state) => {
            if (state.messages.some((m) => m.id === newMsg.id)) return state;
            return { messages: [...state.messages, newMsg] };
          });
        });

        socketService.onMessageUpdated((updatedMsg) => {
          set((state) => ({
            messages: state.messages.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
          }));
        });

        socketService.onMessageDeleted(({ id }) => {
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== id && m.parentMessageId !== id),
            activeThreadId: state.activeThreadId === id ? null : state.activeThreadId,
          }));
        });

        socketService.onReactionToggled(({ messageId, message }) => {
          set((state) => ({
            messages: state.messages.map((m) => (m.id === messageId ? message : m)),
          }));
        });

        socketService.onPinToggled(({ messageId, message }) => {
          set((state) => ({
            messages: state.messages.map((m) => (m.id === messageId ? message : m)),
          }));
        });

        socketService.onPresenceUpdated((updatedUser) => {
          set((state) => ({
            users: state.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
            currentUser: state.currentUser.id === updatedUser.id ? updatedUser : state.currentUser,
          }));
        });

        socketService.onTypingStarted((data) => {
          set((state) => {
            if (data.userId === state.currentUser.id) return state;
            const exists = state.typingUsers.some((u) => u.userId === data.userId);
            if (exists) return state;
            return { typingUsers: [...state.typingUsers, data] };
          });
        });

        socketService.onTypingStopped((data) => {
          set((state) => ({
            typingUsers: state.typingUsers.filter((u) => u.userId !== data.userId),
          }));
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to connect to the server.';
        set({ isLoading: false, error: msg });
      }
    },

    // ── Load messages for the active context ──────────────────────────────
    loadMessages: async (channelId?: string, conversationId?: string) => {
      try {
        set({ messagesLoading: true });
        const msgs = await chatService.getMessages(channelId, conversationId, 50);
        set((state) => {
          // Merge: keep messages for other contexts, replace for this context
          const others = state.messages.filter((m) => {
            if (channelId) return m.channelId !== channelId;
            if (conversationId) return m.conversationId !== conversationId;
            return true;
          });
          return { messages: [...others, ...msgs], messagesLoading: false };
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load messages.';
        set({ messagesLoading: false, error: msg });
      }
    },

    typingUsers: [],
    sendTypingIndicator: (isTyping: boolean) => {
      const { currentUser, activeId, activeType } = get();
      if (isTyping) {
        socketService.startTyping(
          currentUser.id,
          currentUser.name,
          activeType === 'channel' ? activeId : undefined,
          activeType === 'conversation' ? activeId : undefined,
        );
      } else {
        socketService.stopTyping(
          currentUser.id,
          activeType === 'channel' ? activeId : undefined,
          activeType === 'conversation' ? activeId : undefined,
        );
      }
    },

    setCurrentUserStatus: async (status, statusMessage) => {
      const { currentUser } = get();
      try {
        const updated = await chatService.updateStatus(currentUser.id, status, statusMessage);
        // Broadcast presence update via socket so other clients are notified
        socketService.updatePresence(currentUser.id, status, statusMessage);
        set((state) => ({
          currentUser: updated,
          users: state.users.map((u) => (u.id === updated.id ? updated : u)),
        }));
      } catch {
        // Optimistic update in case backend is unavailable
        set((state) => ({
          currentUser: { ...state.currentUser, status, statusMessage: statusMessage ?? state.currentUser.statusMessage },
        }));
      }
    },

    setCurrentUser: (user: User) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('team_chat_user_id', user.id);
      }
      set({ currentUser: user });
    },

    updateCurrentUserProfile: async (name, title, email, avatarUrl) => {
      const { currentUser } = get();
      try {
        const updated = await chatService.updateUserProfile(currentUser.id, {
          name,
          title,
          email,
          avatarUrl: avatarUrl ?? currentUser.avatarUrl,
        });
        set((state) => ({
          currentUser: updated,
          users: state.users.map((u) => (u.id === updated.id ? updated : u)),
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile.';
        set({ error: msg });
        // Optimistic local update so UI doesn't freeze
        set((state) => ({
          currentUser: { ...state.currentUser, name, title, email },
          users: state.users.map((u) => (u.id === state.currentUser.id ? { ...u, name, title, email } : u)),
        }));
      }
    },

    createNewUser: async (data) => {
      const newUser = await chatService.createUser(data);
      set((state) => ({
        users: [...state.users, newUser],
      }));
      return newUser;
    },

    setActiveChannel: (channelId) => {
      const prevChannelId = get().activeType === 'channel' ? get().activeId : null;
      if (prevChannelId && prevChannelId !== channelId) socketService.leaveChannel(prevChannelId);
      socketService.joinChannel(channelId);

      set((state) => ({
        activeId: channelId,
        activeType: 'channel',
        channels: state.channels.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)),
      }));

      // Load messages for the newly active channel
      get().loadMessages(channelId, undefined);
    },

    setActiveConversation: (conversationId) => {
      socketService.joinConversation(conversationId);
      set((state) => ({
        activeId: conversationId,
        activeType: 'conversation',
        conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      }));

      // Load messages for the newly active conversation
      get().loadMessages(undefined, conversationId);
    },

    createChannel: async (name, description, topic, type) => {
      const { currentUser } = get();
      try {
        const newChannel = await chatService.createChannel({
          name,
          description,
          topic,
          type,
          createdById: currentUser.id,
        });
        set((state) => ({
          channels: [...state.channels, newChannel],
          activeId: newChannel.id,
          activeType: 'channel',
          createChannelModalOpen: false,
        }));
        socketService.joinChannel(newChannel.id);
        return newChannel.id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create channel.';
        set({ error: msg });
        return '';
      }
    },

    createConversation: async (userId) => {
      const { currentUser } = get();
      try {
        const convo = await chatService.createConversation([currentUser.id, userId]);
        set((state) => {
          const exists = state.conversations.some((c) => c.id === convo.id);
          return {
            conversations: exists ? state.conversations : [...state.conversations, convo],
            activeId: convo.id,
            activeType: 'conversation',
            peopleModalOpen: false,
          };
        });
        socketService.joinConversation(convo.id);
        get().loadMessages(undefined, convo.id);
        return convo.id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to open conversation.';
        set({ error: msg });
        return '';
      }
    },

    sendMessage: async (content, attachments) => {
      const { activeId, activeType, currentUser } = get();
      const payload: Partial<Message> & { content: string; senderId: string; senderName: string } = {
        content,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatarUrl,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
        attachments: attachments?.map((att, i) => ({
          id: `att-${Date.now()}-${i}`,
          name: att.name,
          size: att.size,
          type: att.type,
          url: att.url,
          createdAt: new Date().toISOString(),
        })),
      };

      try {
        // REST: persist to DB. The gateway will broadcast to all room members.
        const newMsg = await chatService.sendMessage(payload);
        set((state) => {
          if (state.messages.some((m) => m.id === newMsg.id)) return state;
          return { messages: [...state.messages, newMsg] };
        });
        // Notify other clients via socket (gateway will broadcast message:created)
        socketService.sendMessage(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send message.';
        set({ error: msg });
      }
    },

    sendThreadReply: async (parentMessageId, content) => {
      const { activeId, activeType, currentUser } = get();
      const payload: Partial<Message> & { content: string; senderId: string; senderName: string } = {
        content,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatarUrl,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
        parentMessageId,
      };

      try {
        const newMsg = await chatService.sendMessage(payload);
        set((state) => {
          if (state.messages.some((m) => m.id === newMsg.id)) return state;
          return {
            messages: state.messages
              .map((m) =>
                m.id === parentMessageId
                  ? { ...m, replyCount: (m.replyCount || 0) + 1, lastReplyAt: newMsg.createdAt }
                  : m,
              )
              .concat(newMsg),
          };
        });
        socketService.sendMessage(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send reply.';
        set({ error: msg });
      }
    },

    toggleReaction: async (messageId, emoji) => {
      const { currentUser } = get();
      try {
        // REST call persists and returns updated message with new reactions
        const updated = await chatService.toggleReaction(messageId, emoji, currentUser.id, currentUser.name);
        set((state) => ({
          messages: state.messages.map((m) => (m.id === messageId ? updated : m)),
        }));
        // Notify via socket so other clients update in real-time
        socketService.toggleReaction(messageId, emoji, currentUser.id, currentUser.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to toggle reaction.';
        set({ error: msg });
      }
    },

    togglePin: async (messageId) => {
      try {
        const updated = await chatService.togglePin(messageId);
        set((state) => ({
          messages: state.messages.map((m) => (m.id === messageId ? updated : m)),
        }));
        socketService.togglePin(messageId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to toggle pin.';
        set({ error: msg });
      }
    },

    deleteMessage: async (messageId) => {
      try {
        await chatService.deleteMessage(messageId);
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId && m.parentMessageId !== messageId),
          activeThreadId: state.activeThreadId === messageId ? null : state.activeThreadId,
        }));
        socketService.deleteMessage(messageId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete message.';
        set({ error: msg });
      }
    },

    editMessage: async (messageId, newContent) => {
      try {
        const updated = await chatService.editMessage(messageId, newContent);
        set((state) => ({
          messages: state.messages.map((m) => (m.id === messageId ? updated : m)),
        }));
        socketService.editMessage(messageId, newContent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to edit message.';
        set({ error: msg });
      }
    },

    addFile: (file) => set((state) => ({ files: [file, ...state.files] })),

    openThread: (messageId) => set({ activeThreadId: messageId }),
    closeThread: () => set({ activeThreadId: null }),

    toggleDetailsPanel: () => set((state) => ({ detailsPanelOpen: !state.detailsPanelOpen })),
    setDetailsTab: (tab) => set({ detailsTab: tab, detailsPanelOpen: true }),

    setSearchModalOpen: (open) => set({ searchModalOpen: open }),
    setCreateChannelModalOpen: (open) => set({ createChannelModalOpen: open }),
    setInviteModalOpen: (open) => set({ inviteModalOpen: open }),
    setProfileModalOpen: (open) => set({ profileModalOpen: open }),
    setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
    setPeopleModalOpen: (open) => set({ peopleModalOpen: open }),
    taskModalOpen: false,
    setTaskModalOpen: (open) => set({ taskModalOpen: open }),
    approvalModalOpen: false,
    setApprovalModalOpen: (open) => set({ approvalModalOpen: open }),
    actionTargetMessage: null,
    openCreateTaskModal: (message) => set({ actionTargetMessage: message, taskModalOpen: true }),
    openCreateApprovalModal: (message) => set({ actionTargetMessage: message, approvalModalOpen: true }),

    savedDecisions: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('team_chat_decisions') || '[]') : [],
    saveAsDecision: (messageId, title) => {
      const msg = get().messages.find((m) => m.id === messageId);
      const decisionTitle = title || (msg ? msg.content.slice(0, 80) : 'Decision Logged');
      const item = {
        id: `dec-${Date.now()}`,
        messageId,
        title: decisionTitle,
        tags: ['architecture', 'roadmap'],
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const updated = [item, ...state.savedDecisions];
        if (typeof window !== 'undefined') {
          localStorage.setItem('team_chat_decisions', JSON.stringify(updated));
        }
        return { savedDecisions: updated };
      });
    },

    markNotificationAsRead: async (id) => {
      await chatService.markNotificationAsRead(id).catch(() => {});
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      }));
    },

    markAllNotificationsAsRead: async () => {
      await chatService.markAllNotificationsAsRead().catch(() => {});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, unread: false })),
      }));
    },

    setTheme: (theme) => set({ theme }),
    setDensity: (density) => set({ density }),
    setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  };
});
