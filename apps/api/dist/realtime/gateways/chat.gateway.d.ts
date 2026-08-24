import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from '../../presence/presence.service';
import { RealtimeService } from '../realtime.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { UserStatus } from '@team-chat/shared';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly presenceService;
    private readonly realtime;
    private readonly chatAccess;
    server: Server;
    private readonly logger;
    constructor(presenceService: PresenceService, realtime: RealtimeService, chatAccess: ChatAccessService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinChannel(client: Socket, data: {
        channelId: string;
    }): Promise<{
        event: string;
        message: string;
        channelId?: undefined;
    } | {
        event: string;
        channelId: string;
        message?: undefined;
    }>;
    handleLeaveChannel(client: Socket, data: {
        channelId: string;
    }): {
        event: string;
        channelId: string;
    };
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<{
        event: string;
        message: string;
        conversationId?: undefined;
    } | {
        event: string;
        conversationId: string;
        message?: undefined;
    }>;
    handlePresenceUpdate(client: Socket, data: {
        status: UserStatus;
        statusMessage?: string;
    }): Promise<import("@team-chat/shared").User | {
        error: string;
    }>;
    handleTypingStart(client: Socket, data: {
        userName: string;
        channelId?: string;
        conversationId?: string;
    }): void;
    handleTypingStop(client: Socket, data: {
        channelId?: string;
        conversationId?: string;
    }): void;
}
