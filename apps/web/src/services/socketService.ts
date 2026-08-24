import { io, Socket } from 'socket.io-client';
import { Message, User } from '@team-chat/shared';
import { getStoredUserId } from '../lib/currentUser';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        auth: {
          userId: getStoredUserId(),
          workplaceId: 'wp-teamchat-main',
        },
      });
    }
    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinChannel(channelId: string) {
    this.socket?.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', { channelId });
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('conversation:join', { conversationId });
  }

  updatePresence(status: 'online' | 'busy' | 'away' | 'offline', statusMessage?: string) {
    this.socket?.emit('presence:update', { status, statusMessage });
  }

  startTyping(userName: string, channelId?: string, conversationId?: string) {
    this.socket?.emit('typing:start', { userName, channelId, conversationId });
  }

  stopTyping(channelId?: string, conversationId?: string) {
    this.socket?.emit('typing:stop', { channelId, conversationId });
  }

  onMessageCreated(callback: (message: Message) => void) {
    this.socket?.on('message:created', callback);
    return () => {
      this.socket?.off('message:created', callback);
    };
  }

  onMessageUpdated(callback: (message: Message) => void) {
    this.socket?.on('message:updated', callback);
    return () => {
      this.socket?.off('message:updated', callback);
    };
  }

  onMessageDeleted(callback: (data: { id: string }) => void) {
    this.socket?.on('message:deleted', callback);
    return () => {
      this.socket?.off('message:deleted', callback);
    };
  }

  onReactionToggled(callback: (data: { messageId: string; message: Message }) => void) {
    this.socket?.on('reaction:toggled', callback);
    return () => {
      this.socket?.off('reaction:toggled', callback);
    };
  }

  onPinToggled(callback: (data: { messageId: string; message: Message }) => void) {
    this.socket?.on('pin:toggled', callback);
    return () => {
      this.socket?.off('pin:toggled', callback);
    };
  }

  onPresenceUpdated(callback: (user: User) => void) {
    this.socket?.on('presence:updated', callback);
    return () => {
      this.socket?.off('presence:updated', callback);
    };
  }

  onTypingStarted(callback: (data: { userId: string; userName: string; channelId?: string; conversationId?: string }) => void) {
    this.socket?.on('typing:started', callback);
    return () => {
      this.socket?.off('typing:started', callback);
    };
  }

  onTypingStopped(callback: (data: { userId: string; channelId?: string; conversationId?: string }) => void) {
    this.socket?.on('typing:stopped', callback);
    return () => {
      this.socket?.off('typing:stopped', callback);
    };
  }

  onConnect(callback: () => void) {
    this.socket?.on('connect', callback);
    return () => {
      this.socket?.off('connect', callback);
    };
  }

  onDisconnect(callback: () => void) {
    this.socket?.on('disconnect', callback);
    return () => {
      this.socket?.off('disconnect', callback);
    };
  }
}

export const socketService = new SocketService();
