import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PresenceService } from '../../presence/presence.service';
import { RealtimeService } from '../realtime.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { UserStatus } from '@team-chat/shared';
import {
  DEFAULT_MOCK_USER_ID,
  DEFAULT_WORKPLACE_ID,
} from '../../common/request-user';

function allowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';
  const fromEnv = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return ['http://localhost:5173', 'http://localhost:3001'];
}

@WebSocketGateway({
  cors: {
    origin: allowedOrigins(),
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly presenceService: PresenceService,
    private readonly realtime: RealtimeService,
    private readonly chatAccess: ChatAccessService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  handleConnection(client: Socket) {
    const userId =
      (client.handshake.auth?.userId as string) ||
      (client.handshake.headers['x-user-id'] as string) ||
      DEFAULT_MOCK_USER_ID;
    const workplaceId =
      (client.handshake.auth?.workplaceId as string) ||
      (client.handshake.headers['x-workplace-id'] as string) ||
      DEFAULT_WORKPLACE_ID;
    client.data.userId = userId;
    client.data.workplaceId = workplaceId;
    this.logger.log(`Client connected: ${client.id} as ${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('channel:join')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    const userId = client.data.userId as string;
    const allowed = await this.chatAccess.canJoinChannel(userId, data.channelId);
    if (!allowed) {
      return { event: 'error', message: 'Not allowed to join this channel' };
    }
    const room = `channel:${data.channelId}`;
    client.join(room);
    return { event: 'joined', channelId: data.channelId };
  }

  @SubscribeMessage('channel:leave')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`channel:${data.channelId}`);
    return { event: 'left', channelId: data.channelId };
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId as string;
    const allowed = await this.chatAccess.canJoinConversation(
      userId,
      data.conversationId,
    );
    if (!allowed) {
      return { event: 'error', message: 'Not allowed to join this conversation' };
    }
    client.join(`conversation:${data.conversationId}`);
    return { event: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      status: UserStatus;
      statusMessage?: string;
    },
  ) {
    const userId = client.data.userId as string;
    try {
      const user = await this.presenceService.setPresence(
        userId,
        data.status,
        data.statusMessage,
      );
      this.realtime.emitGlobal('presence:updated', user);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to update presence for ${userId}: ${(error as Error).message}`,
      );
      return { error: 'Failed to update presence' };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userName: string;
      channelId?: string;
      conversationId?: string;
    },
  ) {
    const userId = client.data.userId as string;
    const payload = { userId, userName: data.userName, channelId: data.channelId, conversationId: data.conversationId };
    this.realtime.emitToChat(data, 'typing:started', payload);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { channelId?: string; conversationId?: string },
  ) {
    const userId = client.data.userId as string;
    this.realtime.emitToChat(data, 'typing:stopped', {
      userId,
      channelId: data.channelId,
      conversationId: data.conversationId,
    });
  }
}
