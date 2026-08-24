import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message, User } from '@team-chat/shared';
import { chatService } from '../services';
import { queryKeys } from '../lib/queryKeys';
import { DEFAULT_CURRENT_USER, getStoredUserId, setStoredUserId } from '../lib/currentUser';
import { useUiStore } from '../stores';

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

  const users = usersQuery.data ?? [];
  const storedId = getStoredUserId();
  const currentUser =
    users.find((u) => u.id === storedId) ||
    users.find((u) => u.id === DEFAULT_CURRENT_USER.id) ||
    users[0] ||
    DEFAULT_CURRENT_USER;

  return {
    users,
    channels: channelsQuery.data ?? [],
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
  const messages = query.data
    ? [...query.data.pages].reverse().flatMap((page) => page.items)
    : [];
  const lastReadMessageId = query.data?.pages[0]?.lastReadMessageId ?? null;
  return {
    ...query,
    messages,
    lastReadMessageId,
  };
}

export function useChatMutations() {
  const queryClient = useQueryClient();
  const { activeId, activeType, setError, setActiveChannel, setActiveConversation, setCreateChannelModalOpen, setPeopleModalOpen } =
    useUiStore();

  const invalidateMessages = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeType, activeId) });
  };

  return {
    sendMessage: useMutation({
      mutationFn: (input: {
        content: string;
        attachments?: { name: string; url: string; size: number; type: string }[];
        parentMessageId?: string;
      }) =>
        chatService.sendMessage({
          content: input.content,
          attachments: input.attachments,
          parentMessageId: input.parentMessageId,
          channelId: activeType === 'channel' ? activeId : undefined,
          conversationId: activeType === 'conversation' ? activeId : undefined,
        }),
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
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.channels });
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      },
    }),
    switchUser: (user: User) => {
      setStoredUserId(user.id);
      void queryClient.invalidateQueries();
    },
  };
}
