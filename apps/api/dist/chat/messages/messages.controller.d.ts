import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ToggleReactionDto } from '../reactions/dto/toggle-reaction.dto';
import type { RequestUser } from '../../common/request-user';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findAll(user: RequestUser, channelId?: string, conversationId?: string, limit?: number, cursor?: string): Promise<import("./messages.service").MessageListResult>;
    sync(user: RequestUser, channelId?: string, conversationId?: string, since?: string): Promise<import("@team-chat/shared").Message[]>;
    findPinned(user: RequestUser, channelId?: string, conversationId?: string): Promise<import("@team-chat/shared").Message[]>;
    findOne(id: string, user: RequestUser): Promise<import("@team-chat/shared").Message>;
    create(user: RequestUser, body: CreateMessageDto): Promise<import("@team-chat/shared").Message>;
    update(user: RequestUser, id: string, body: EditMessageDto): Promise<import("@team-chat/shared").Message>;
    delete(user: RequestUser, id: string): Promise<{
        success: boolean;
    }>;
    togglePin(id: string, user: RequestUser): Promise<import("@team-chat/shared").Message>;
    toggleReaction(user: RequestUser, id: string, body: ToggleReactionDto): Promise<import("@team-chat/shared").Message>;
    getReplies(id: string, user: RequestUser): Promise<import("@team-chat/shared").Message[]>;
    markAsRead(user: RequestUser, id: string): Promise<{
        success: boolean;
    }>;
}
