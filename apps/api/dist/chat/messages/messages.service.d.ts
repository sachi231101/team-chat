import { Message as PrismaMessage, User, MessageReaction, Attachment } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';
import { CreateMessageDto } from './dto/create-message.dto';
import { RealtimeService } from '../../realtime/realtime.service';
import { MentionsService } from '../mentions/mentions.service';
type MessageWithRelations = PrismaMessage & {
    sender: User | null;
    reactions: (MessageReaction & {
        user: User | null;
    })[];
    attachments: Attachment[];
    replies?: PrismaMessage[];
};
export interface MessageListResult {
    items: Message[];
    nextCursor: string | null;
    lastReadMessageId: string | null;
}
export declare class MessagesService {
    private readonly prisma;
    private readonly realtime;
    private readonly mentions;
    constructor(prisma: PrismaService, realtime: RealtimeService, mentions: MentionsService);
    findAll(userId: string, channelId?: string, conversationId?: string, limit?: number, cursor?: string): Promise<MessageListResult>;
    findOne(id: string): Promise<Message>;
    create(userId: string, body: CreateMessageDto): Promise<Message>;
    update(id: string, content: string, userId: string): Promise<Message>;
    delete(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    togglePin(id: string): Promise<Message>;
    toggleReaction(messageId: string, emoji: string, userId: string): Promise<Message>;
    getReplies(parentMessageId: string): Promise<Message[]>;
    markAsRead(messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    findPinnedForUser(userId: string): Promise<Message[]>;
    findPinned(channelId?: string, conversationId?: string): Promise<Message[]>;
    mapMessageToDto(m: MessageWithRelations): Message;
}
export {};
