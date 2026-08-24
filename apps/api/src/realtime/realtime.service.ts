import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToChannel(channelId: string, event: string, payload: unknown) {
    this.emit(`channel:${channelId}`, event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.emit(`conversation:${conversationId}`, event, payload);
  }

  emitToChat(
    target: { channelId?: string | null; conversationId?: string | null },
    event: string,
    payload: unknown,
  ) {
    if (target.channelId) {
      this.emitToChannel(target.channelId, event, payload);
    } else if (target.conversationId) {
      this.emitToConversation(target.conversationId, event, payload);
    }
  }

  emitGlobal(event: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn(`Skipped emit ${event}: socket server not ready`);
      return;
    }
    this.server.emit(event, payload);
  }

  private emit(room: string, event: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn(`Skipped emit ${event} to ${room}: socket server not ready`);
      return;
    }
    this.server.to(room).emit(event, payload);
  }
}
