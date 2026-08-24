import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MessagesService } from '../../chat/messages/messages.service';
import { PresenceService } from '../../presence/presence.service';
import { Message, UserStatus } from '@team-chat/shared';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:5173',
      'http://localhost:3001',
    ],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly presenceService: PresenceService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('channel:join')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    const room = `channel:${data.channelId}`;
    client.join(room);
    return { event: 'joined', channelId: data.channelId };
  }

  @SubscribeMessage('channel:leave')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    const room = `channel:${data.channelId}`;
    client.leave(room);
    return { event: 'left', channelId: data.channelId };
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.join(room);
    return { event: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('message:send')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: Partial<Message> & {
      content: string;
      senderId?: string;
      senderName?: string;
      channelId?: string;
      conversationId?: string;
      parentMessageId?: string;
    },
  ) {
    // Message was ALREADY persisted by the REST POST /messages route.
    // This handler just broadcasts to other clients in the same room.
    if (data.channelId) {
      client.to(`channel:${data.channelId}`).emit('message:created', data);
    } else if (data.conversationId) {
      client.to(`conversation:${data.conversationId}`).emit('message:created', data);
    }
    return { received: true };
  }

  @SubscribeMessage('message:edit')
  handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string; content: string },
  ) {
    // Message was already updated by the REST PATCH /messages/:id route.
    // Broadcast the edit event to all other connected clients.
    client.broadcast.emit('message:updated', { id: data.id, content: data.content, editedAt: new Date().toISOString() });
    return { received: true };
  }

  @SubscribeMessage('message:delete')
  handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string },
  ) {
    // Message was already deleted by the REST DELETE /messages/:id route.
    // Broadcast the deletion event to all other connected clients.
    client.broadcast.emit('message:deleted', { id: data.id });
    return { received: true };
  }

  @SubscribeMessage('reaction:toggle')
  handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      emoji: string;
      userId: string;
      userName?: string;
    },
  ) {
    // Reaction was already toggled by the REST POST /messages/:id/reactions route.
    // Broadcast to other clients so their UI updates in real-time.
    client.broadcast.emit('reaction:toggled', {
      messageId: data.messageId,
      message: data,
    });
    return { received: true };
  }

  @SubscribeMessage('pin:toggle')
  handleTogglePin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    // Pin was already toggled by the REST PATCH /messages/:id/pin route.
    // Broadcast to other clients so their UI updates in real-time.
    client.broadcast.emit('pin:toggled', {
      messageId: data.messageId,
    });
    return { received: true };
  }

  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    data: {
      userId: string;
      status: UserStatus;
      statusMessage?: string;
    },
  ) {
    try {
      // 1. Persist status in PostgreSQL first
      const user = await this.presenceService.setPresence(
        data.userId,
        data.status,
        data.statusMessage,
      );

      // 2. Broadcast on success
      this.server.emit('presence:updated', user);
      return user;
    } catch (error) {
      this.logger.error(`Failed to update presence for ${data.userId}: ${(error as Error).message}`);
      return { error: 'Failed to update presence' };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userId: string;
      userName: string;
      channelId?: string;
      conversationId?: string;
    },
  ) {
    client.broadcast.emit('typing:started', data);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { userId: string; channelId?: string; conversationId?: string },
  ) {
    client.broadcast.emit('typing:stopped', data);
  }
}
