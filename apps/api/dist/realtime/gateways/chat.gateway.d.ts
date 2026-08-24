import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../../chat/messages/messages.service';
import { PresenceService } from '../../presence/presence.service';
import { Message, UserStatus } from '@team-chat/shared';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagesService;
    private readonly presenceService;
    server: Server;
    private readonly logger;
    constructor(messagesService: MessagesService, presenceService: PresenceService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinChannel(client: Socket, data: {
        channelId: string;
    }): {
        event: string;
        channelId: string;
    };
    handleLeaveChannel(client: Socket, data: {
        channelId: string;
    }): {
        event: string;
        channelId: string;
    };
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): {
        event: string;
        conversationId: string;
    };
    handleSendMessage(client: Socket, data: Partial<Message> & {
        content: string;
        senderId?: string;
        senderName?: string;
        channelId?: string;
        conversationId?: string;
        parentMessageId?: string;
    }): {
        received: boolean;
    };
    handleEditMessage(client: Socket, data: {
        id: string;
        content: string;
    }): {
        received: boolean;
    };
    handleDeleteMessage(client: Socket, data: {
        id: string;
    }): {
        received: boolean;
    };
    handleToggleReaction(client: Socket, data: {
        messageId: string;
        emoji: string;
        userId: string;
        userName?: string;
    }): {
        received: boolean;
    };
    handleTogglePin(client: Socket, data: {
        messageId: string;
    }): {
        received: boolean;
    };
    handlePresenceUpdate(_client: Socket, data: {
        userId: string;
        status: UserStatus;
        statusMessage?: string;
    }): Promise<import("@team-chat/shared").User | {
        error: string;
    }>;
    handleTypingStart(client: Socket, data: {
        userId: string;
        userName: string;
        channelId?: string;
        conversationId?: string;
    }): void;
    handleTypingStop(client: Socket, data: {
        userId: string;
        channelId?: string;
        conversationId?: string;
    }): void;
}
