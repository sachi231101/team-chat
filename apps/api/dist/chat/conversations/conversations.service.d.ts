import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { Conversation } from '@team-chat/shared';
export declare class ConversationsService {
    private readonly prisma;
    private readonly chatAccess;
    constructor(prisma: PrismaService, chatAccess: ChatAccessService);
    findAll(workplaceId?: string, userId?: string): Promise<Conversation[]>;
    findOne(id: string, workplaceId?: string): Promise<Conversation>;
    create(data: {
        participants: string[];
        workplaceId?: string;
    }): Promise<Conversation>;
    private findMatchingConversation;
    private findMatchingConversationTx;
}
