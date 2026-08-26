import { Message as PrismaMessage, User, MessageReaction, Attachment, MessageTag, ActionItem } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService, UserContext } from '../../common/chat-access.service';
import { Message } from '@team-chat/shared';
import { CreateMessageDto } from './dto/create-message.dto';
import { RealtimeService } from '../../realtime/realtime.service';
import { MentionsService } from '../mentions/mentions.service';
import { AiOrchestratorService } from '../../ai/ai-orchestrator.service';
type MessageWithRelations = PrismaMessage & {
    sender: User | null;
    reactions: (MessageReaction & {
        user: User | null;
    })[];
    attachments: Attachment[];
    replies?: PrismaMessage[];
    tags?: (MessageTag & {
        user: User | null;
    })[];
    actionItems?: (ActionItem & {
        assignee?: User | null;
        creator?: User | null;
    })[];
};
export interface MessageListResult {
    items: Message[];
    nextCursor: string | null;
    lastReadMessageId: string | null;
}
export declare class MessagesService {
    private readonly prisma;
    private readonly chatAccess;
    private readonly realtime;
    private readonly mentions;
    private readonly ai;
    constructor(prisma: PrismaService, chatAccess: ChatAccessService, realtime: RealtimeService, mentions: MentionsService, ai: AiOrchestratorService);
    private extractUser;
    findAll(userOrId: UserContext | string, channelId?: string, conversationId?: string, limit?: number, cursor?: string): Promise<MessageListResult>;
    syncSince(userOrId: UserContext | string, channelId?: string, conversationId?: string, since?: string): Promise<Message[]>;
    findOne(id: string, userOrId?: UserContext | string): Promise<Message>;
    create(userOrId: UserContext | string, body: CreateMessageDto): Promise<Message>;
    update(id: string, content: string, userOrId: UserContext | string): Promise<Message>;
    delete(id: string, userOrId: UserContext | string): Promise<{
        success: boolean;
    }>;
    togglePin(id: string, userOrId?: UserContext | string): Promise<Message>;
    toggleReaction(messageId: string, emoji: string, userOrId: UserContext | string): Promise<Message>;
    getReplies(parentMessageId: string, userOrId?: UserContext | string): Promise<Message[]>;
    markAsRead(messageId: string, userOrId: UserContext | string): Promise<{
        success: boolean;
    }>;
    findPinnedForUser(userOrId: UserContext | string): Promise<Message[]>;
    findPinned(channelId?: string, conversationId?: string, userOrId?: UserContext | string): Promise<Message[]>;
    mapMessageToDto(m: MessageWithRelations): Message;
}
export {};
