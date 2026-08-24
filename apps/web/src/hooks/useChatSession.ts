import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Message, User } from '@team-chat/shared';
import { socketService } from '../services';
import { useUiStore } from '../stores';
import { queryKeys } from '../lib/queryKeys';
import { setStoredUserId } from '../lib/currentUser';
import { useWorkspace } from './useChatQueries';

export function useChatSession() {
  const queryClient = useQueryClient();
  const { users, channels, currentUser, isLoading } = useWorkspace();
  const {
    activeId,
    activeType,
    setActiveChannel,
    setConnected,
    addTypingUser,
    removeTypingUser,
    closeThread,
    activeThreadId,
  } = useUiStore();
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    setStoredUserId(currentUser.id);
  }, [currentUser.id]);

  useEffect(() => {
    if (isLoading) return;
    if (!activeId && channels[0]?.id) {
      setActiveChannel(channels[0].id);
    }
  }, [isLoading, activeId, channels, setActiveChannel]);

  useEffect(() => {
    socketService.connect();
    const offConnect = socketService.onConnect(() => setConnected(true));
    const offDisconnect = socketService.onDisconnect(() => setConnected(false));

    const patchMessage = (message: Message) => {
      const type = message.channelId ? 'channel' : 'conversation';
      const id = message.channelId || message.conversationId;
      if (!id) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(type, id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    };

    const offCreated = socketService.onMessageCreated(patchMessage);
    const offUpdated = socketService.onMessageUpdated(patchMessage);
    const offDeleted = socketService.onMessageDeleted(({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (useUiStore.getState().activeThreadId === id) closeThread();
    });
    const offReaction = socketService.onReactionToggled(({ message }) => patchMessage(message));
    const offPin = socketService.onPinToggled(({ message }) => {
      if (message) patchMessage(message);
      else void queryClient.invalidateQueries({ queryKey: ['messages'] });
    });
    const offPresence = socketService.onPresenceUpdated((user: User) => {
      queryClient.setQueryData<User[]>(queryKeys.users, (prev) =>
        (prev ?? []).map((u) => (u.id === user.id ? user : u)),
      );
    });
    const offTypingStart = socketService.onTypingStarted((data) => {
      if (data.userId === currentUser.id) return;
      addTypingUser(data);
    });
    const offTypingStop = socketService.onTypingStopped((data) => {
      removeTypingUser(data.userId);
    });

    return () => {
      offConnect();
      offDisconnect();
      offCreated();
      offUpdated();
      offDeleted();
      offReaction();
      offPin();
      offPresence();
      offTypingStart();
      offTypingStop();
    };
  }, [addTypingUser, closeThread, currentUser.id, queryClient, removeTypingUser, setConnected]);

  useEffect(() => {
    if (!activeId) return;
    const key = `${activeType}:${activeId}`;
    if (joinedRef.current && joinedRef.current !== key) {
      const [prevType, prevId] = joinedRef.current.split(':');
      if (prevType === 'channel') socketService.leaveChannel(prevId);
    }
    if (activeType === 'channel') socketService.joinChannel(activeId);
    else socketService.joinConversation(activeId);
    joinedRef.current = key;
  }, [activeId, activeType]);

  return { isLoading, users, currentUser };
}
