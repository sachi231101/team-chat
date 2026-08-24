import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ToggleReactionDto } from '../reactions/dto/toggle-reaction.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findAll(channelId?: string, conversationId?: string, limit?: number, cursor?: string): Promise<import("@team-chat/shared").Message[]>;
    findOne(id: string): Promise<import("@team-chat/shared").Message>;
    create(body: CreateMessageDto): Promise<import("@team-chat/shared").Message>;
    update(id: string, body: EditMessageDto): Promise<import("@team-chat/shared").Message>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    togglePin(id: string): Promise<import("@team-chat/shared").Message>;
    toggleReaction(id: string, body: ToggleReactionDto): Promise<import("@team-chat/shared").Message>;
    getReplies(id: string): Promise<import("@team-chat/shared").Message[]>;
    markAsRead(id: string): Promise<{
        success: boolean;
    }>;
    summarizeThread(id: string): Promise<{
        summary: string;
        decisions: string[];
        openQuestions: string[];
        actionItems: {
            owner: string;
            task: string;
        }[];
        blockers: string[];
    }>;
}
