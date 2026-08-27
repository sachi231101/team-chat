import { useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Message,
  User,
  Channel,
  ActionItem,
  CreateActionItemDto,
  UpdateActionItemDto,
  MessageTagType,
} from '@team-chat/shared';
import { chatService } from '../services';
import { queryKeys } from '../lib/queryKeys';
export { queryKeys };
import { DEFAULT_CURRENT_USER, getStoredUserId, setStoredUserId } from '../lib/currentUser';

import { useUiStore } from '../stores';

export function useChannelMembersQuery(channelId?: string | null) {
  return useQuery({
    queryKey: queryKeys.channelMembers(channelId || ''),
    queryFn: () => chatService.getChannelMembers(channelId!),
    enabled: Boolean(channelId),
  });
}

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: chatService.getUsers,
  });
}

export function useChannelsQuery() {
  return useQuery({
    queryKey: queryKeys.channels,
    queryFn: chatService.getChannels,
  });
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: chatService.getConversations,
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: chatService.getNotifications,
  });
}

export function useSavedIdsQuery() {
  return useQuery({
    queryKey: queryKeys.savedIds,
    queryFn: chatService.getSavedMessageIds,
  });
}

export function usePinnedMessagesQuery() {
  return useQuery({
    queryKey: queryKeys.pinned('all', 'workspace'),
    queryFn: () => chatService.getPinnedMessages(),
  });
}

export function useContextPinnedMessagesQuery() {
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);

  return useQuery({
    queryKey: queryKeys.pinned(activeType, activeId),
    queryFn: () =>
      chatService.getPinnedMessages(
        activeType === 'channel' ? activeId : undefined,
        activeType === 'conversation' ? activeId : undefined,
      ),
    enabled: Boolean(activeId),
  });
}

export function useContextActionsQuery(status?: string) {
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);

  return useQuery({
    queryKey: [...queryKeys.actions(activeType, activeId), status ?? 'ALL'],
    queryFn: () =>
      chatService.getActionItems({
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
        status: status && status !== 'ALL' ? status : undefined,
      }),
    enabled: Boolean(activeId),
  });
}

export function useContextDecisionsQuery() {
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);

  return useQuery({
    queryKey: queryKeys.decisions(activeType, activeId),
    queryFn: () =>
      chatService.getDecisions({
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
      }),
    enabled: Boolean(activeId),
  });
}

export function useSavedMessagesQuery() {
  return useQuery({
    queryKey: queryKeys.savedMessages,
    queryFn: chatService.getSavedMessages,
  });
}

export function useWorkspace() {
  const usersQuery = useUsersQuery();
  const channelsQuery = useChannelsQuery();
  const conversationsQuery = useConversationsQuery();
  const notificationsQuery = useNotificationsQuery();
  const savedIdsQuery = useSavedIdsQuery();
  const pruneStarredChannels = useUiStore((s) => s.pruneStarredChannels);

  const users = usersQuery.data ?? [];
  const channels = channelsQuery.data ?? [];
  const storedId = getStoredUserId();
  const currentUser =
    users.find((u) => u.id === storedId) ||
    users.find((u) => u.id === DEFAULT_CURRENT_USER.id) ||
    users[0] ||
    DEFAULT_CURRENT_USER;

  useEffect(() => {
    if (channels.length === 0) return;
    pruneStarredChannels(channels.map((c) => c.id));
  }, [channels, pruneStarredChannels]);

  return {
    users,
    channels,
    conversations: conversationsQuery.data ?? [],
    notifications: notificationsQuery.data ?? [],
    savedMessageIds: savedIdsQuery.data ?? [],
    currentUser,
    isLoading: usersQuery.isLoading || channelsQuery.isLoading,
  };
}

export function useMessagesQuery() {
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);

  return useInfiniteQuery({
    queryKey: queryKeys.messages(activeType, activeId),
    queryFn: ({ pageParam }) =>
      chatService.getMessages(
        activeType === 'channel' ? activeId : undefined,
        activeType === 'conversation' ? activeId : undefined,
        50,
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(activeId),
  });
}

export function useActiveMessages() {
  const query = useMessagesQuery();
  const outbox = useUiStore((s) => s.outbox);
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);

  const fetchedMessages = query.data
    ? [...query.data.pages].reverse().flatMap((page) => page.items)
    : [];

  // Merge pending outbox items for optimistic UI
  const pendingOutbox = outbox
    .filter((o) =>
      activeType === 'channel'
        ? o.channelId === activeId
        : o.conversationId === activeId,
    )
    .filter((o) => !fetchedMessages.some((m) => m.clientMessageId === o.clientMessageId));

  const optimisticMessages: Message[] = pendingOutbox.map((o) => ({
    id: o.clientMessageId,
    clientMessageId: o.clientMessageId,
    content: o.content,
    senderId: getStoredUserId(),
    senderName: 'You',
    channelId: o.channelId,
    conversationId: o.conversationId,
    parentMessageId: o.parentMessageId,
    reactions: [],
    attachments: o.attachments?.map((a, i) => ({
      id: `att-pending-${i}`,
      name: a.name,
      size: a.size,
      type: a.type,
      url: a.url,
      createdAt: o.createdAt,
    })),
    deliveryStatus: o.status,
    createdAt: o.createdAt,
    updatedAt: o.createdAt,
  }));

  const messages = [...fetchedMessages, ...optimisticMessages];
  const lastReadMessageId = query.data?.pages[0]?.lastReadMessageId ?? null;

  return {
    ...query,
    messages,
    lastReadMessageId,
  };
}

export function useChatMutations() {
  const queryClient = useQueryClient();
  const {
    activeId,
    activeType,
    setError,
    setActiveChannel,
    setActiveConversation,
    setCreateChannelModalOpen,
    setPeopleModalOpen,
    addOutboxItem,
    updateOutboxItem,
    removeOutboxItem,
  } = useUiStore();

  const invalidateMessages = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeType, activeId) });
  };

  return {
    sendMessage: useMutation({
      mutationFn: async (input: {
        content: string;
        attachments?: { name: string; url: string; size: number; type: string }[];
        parentMessageId?: string;
        clientMessageId?: string;
        scheduledFor?: string;
      }) => {
        const clientMessageId = input.clientMessageId || `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const isScheduled = Boolean(input.scheduledFor);
        const outboxEntry = {
          clientMessageId,
          content: input.content,
          channelId: activeType === 'channel' ? activeId : undefined,
          conversationId: activeType === 'conversation' ? activeId : undefined,
          parentMessageId: input.parentMessageId,
          attachments: input.attachments,
          status: 'sending' as const,
          createdAt: new Date().toISOString(),
        };

        if (!isScheduled) addOutboxItem(outboxEntry);

        try {
          const res = await chatService.sendMessage({
            clientMessageId,
            content: input.content,
            attachments: input.attachments,
            parentMessageId: input.parentMessageId,
            scheduledFor: input.scheduledFor,
            channelId: activeType === 'channel' ? activeId : undefined,
            conversationId: activeType === 'conversation' ? activeId : undefined,
          });
          if (!isScheduled) removeOutboxItem(clientMessageId);
          return res;
        } catch (err: any) {
          if (!isScheduled) updateOutboxItem(clientMessageId, 'failed', err.message);
          throw err;
        }
      },
      onSuccess: () => {
        invalidateMessages();
        void queryClient.invalidateQueries({ queryKey: ['message-replies'] });
        void queryClient.invalidateQueries({ queryKey: ['message'] });
      },
      onError: (err: Error) => setError(err.message),
    }),
    editMessage: useMutation({
      mutationFn: ({ id, content }: { id: string; content: string }) =>
        chatService.editMessage(id, content),
      onSuccess: invalidateMessages,
      onError: (err: Error) => setError(err.message),
    }),
    deleteMessage: useMutation({
      mutationFn: (id: string) => chatService.deleteMessage(id),
      onSuccess: invalidateMessages,
      onError: (err: Error) => setError(err.message),
    }),
    toggleReaction: useMutation({
      mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
        chatService.toggleReaction(id, emoji),
      onSuccess: invalidateMessages,
      onError: (err: Error) => setError(err.message),
    }),
    togglePin: useMutation({
      mutationFn: (id: string) => chatService.togglePin(id),
      onSuccess: () => {
        invalidateMessages();
        void queryClient.invalidateQueries({ queryKey: queryKeys.pinned('all', 'workspace') });
        void queryClient.invalidateQueries({ queryKey: queryKeys.pinned(activeType, activeId) });
      },
      onError: (err: Error) => setError(err.message),
    }),
    toggleSave: useMutation({
      mutationFn: (messageId: string) => chatService.toggleSavedMessage(messageId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.savedIds });
        void queryClient.invalidateQueries({ queryKey: queryKeys.savedMessages });
      },
      onError: (err: Error) => setError(err.message),
    }),
    markRead: useMutation({
      mutationFn: (id: string) => chatService.markMessageAsRead(id),
    }),
    createChannel: useMutation({
      mutationFn: (data: { name: string; description: string; topic: string; type: 'public' | 'private' }) =>
        chatService.createChannel(data),
      onSuccess: (channel) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.channels });
        setCreateChannelModalOpen(false);
        setActiveChannel(channel.id);
      },
      onError: (err: Error) => setError(err.message),
    }),
    createConversation: useMutation({
      mutationFn: (userId: string) => {
        const currentId = getStoredUserId();
        return chatService.createConversation([currentId, userId]);
      },
      onSuccess: (convo) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        setPeopleModalOpen(false);
        setActiveConversation(convo.id);
      },
      onError: (err: Error) => setError(err.message),
    }),
    updateProfile: useMutation({
      mutationFn: (data: { name: string; title: string; email: string; avatarUrl?: string }) =>
        chatService.updateUserProfile(getStoredUserId(), data),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      },
      onError: (err: Error) => setError(err.message),
    }),
    updateStatus: useMutation({
      mutationFn: (data: { status: User['status']; statusMessage?: string }) =>
        chatService.updateStatus(getStoredUserId(), data.status, data.statusMessage),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      },
      onError: (err: Error) => setError(err.message),
    }),
    createUser: useMutation({
      mutationFn: chatService.createUser,
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
        void queryClient.invalidateQueries({ queryKey: queryKeys.channels });
      },
    }),
    markNotificationAsRead: useMutation({
      mutationFn: chatService.markNotificationAsRead,
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      },
    }),
    markAllNotificationsAsRead: useMutation({
      mutationFn: chatService.markAllNotificationsAsRead,
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      },
    }),
    addChannelMembers: useMutation({
      mutationFn: ({ channelId, userIds }: { channelId: string; userIds: string[] }) =>
        chatService.addChannelMembers(channelId, userIds),
      onSuccess: (_data, vars) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.channels });
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
        void queryClient.invalidateQueries({ queryKey: queryKeys.channelMembers(vars.channelId) });
      },
    }),
    leaveChannel: useMutation({
      mutationFn: (channelId: string) =>
        chatService.removeChannelMember(channelId, getStoredUserId()),
      onSuccess: (_result, channelId) => {
        const remaining = (queryClient.getQueryData<Channel[]>(queryKeys.channels) ?? []).filter(
          (c) => c.id !== channelId,
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.channels });
        void queryClient.invalidateQueries({ queryKey: queryKeys.channelMembers(channelId) });
        if (remaining.length > 0) {
          setActiveChannel(remaining[0].id);
        } else {
          useUiStore.setState({ activeId: '', chatHeaderTab: 'messages' });
        }
      },
      onError: (err: Error) => setError(err.message),
    }),
    switchUser: (user: User) => {
      setStoredUserId(user.id);
      void queryClient.invalidateQueries();
    },

    // Action Items Mutations (Pillar 5)
    createActionItem: useMutation({
      mutationFn: (data: CreateActionItemDto) => chatService.createActionItem(data),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['actions'] });
        invalidateMessages();
      },
      onError: (err: Error) => setError(err.message),
    }),
    updateActionItem: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateActionItemDto }) =>
        chatService.updateActionItem(id, data),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['actions'] });
        invalidateMessages();
      },
      onError: (err: Error) => setError(err.message),
    }),
    deleteActionItem: useMutation({
      mutationFn: (id: string) => chatService.deleteActionItem(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['actions'] });
        invalidateMessages();
      },
      onError: (err: Error) => setError(err.message),
    }),

    // Context & Decision Tagging Mutations (Pillar 4)
    toggleMessageTag: useMutation({
      mutationFn: ({ messageId, tag, note }: { messageId: string; tag: MessageTagType; note?: string }) =>
        chatService.toggleMessageTag(messageId, { tag, note }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['decisions'] });
        invalidateMessages();
      },
      onError: (err: Error) => setError(err.message),
    }),
  };
}
