import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(channelId?: string, conversationId?: string, limit?: number, cursor?: string): Promise<Message[]>;
    findOne(id: string): Promise<Message>;
    create(body: CreateMessageDto): Promise<Message>;
    update(id: string, content: string): Promise<Message>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    togglePin(id: string): Promise<Message>;
    toggleReaction(messageId: string, emoji: string, userId?: string, _userName?: string): Promise<Message>;
    getReplies(parentMessageId: string): Promise<Message[]>;
    markAsRead(messageId: string, userId?: string): Promise<{
        success: boolean;
    }>;
    summarizeThread(messageId: string): Promise<{
        summary: string;
        decisions: string[];
        openQuestions: string[];
        actionItems: {
            owner: string;
            task: string;
        }[];
        blockers: string[];
    }>;
    triggerBotReplyIfNeeded(createdMessage: Message): Promise<void>;
    private mapMessageToDto;
}
