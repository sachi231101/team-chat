import { PrismaService } from '../../common/prisma.service';
import { Conversation } from '@team-chat/shared';
export declare class ConversationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(workplaceId?: string, userId?: string): Promise<Conversation[]>;
    findOne(id: string, workplaceId?: string): Promise<Conversation>;
    create(data: {
        participants: string[];
        workplaceId?: string;
    }): Promise<Conversation>;
}
