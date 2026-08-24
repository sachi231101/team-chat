import { io, Socket } from 'socket.io-client';
import { Message, User } from '@team-chat/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('🟢 Socket connected to backend:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected from backend');
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

  sendMessage(data: Partial<Message> & { content: string; senderId: string; senderName: string }) {
    this.socket?.emit('message:send', data);
  }

  editMessage(id: string, content: string) {
    this.socket?.emit('message:edit', { id, content });
  }

  deleteMessage(id: string) {
    this.socket?.emit('message:delete', { id });
  }

  toggleReaction(messageId: string, emoji: string, userId: string, userName: string) {
    this.socket?.emit('reaction:toggle', { messageId, emoji, userId, userName });
  }

  togglePin(messageId: string) {
    this.socket?.emit('pin:toggle', { messageId });
  }

  updatePresence(userId: string, status: 'online' | 'busy' | 'away' | 'offline', statusMessage?: string) {
    this.socket?.emit('presence:update', { userId, status, statusMessage });
  }

  startTyping(userId: string, userName: string, channelId?: string, conversationId?: string) {
    this.socket?.emit('typing:start', { userId, userName, channelId, conversationId });
  }

  stopTyping(userId: string, channelId?: string, conversationId?: string) {
    this.socket?.emit('typing:stop', { userId, channelId, conversationId });
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
}

export const socketService = new SocketService();
