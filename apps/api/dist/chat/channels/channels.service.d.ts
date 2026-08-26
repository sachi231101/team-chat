import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { RequestUser } from '../../common/request-user';
import { Channel, User } from '@team-chat/shared';
export declare class ChannelsService {
    private readonly prisma;
    private readonly chatAccess;
    constructor(prisma: PrismaService, chatAccess: ChatAccessService);
    findAll(workplaceId?: string, userId?: string): Promise<Channel[]>;
    findOne(id: string, workplaceId?: string): Promise<Channel>;
    create(data: {
        name: string;
        description?: string;
        topic?: string;
        type: 'public' | 'private';
        createdById?: string;
        workplaceId?: string;
    }): Promise<Channel>;
    getMembers(channelId: string, user?: RequestUser): Promise<User[]>;
    addMembers(channelId: string, userIds: string[], user?: RequestUser): Promise<User[]>;
    removeMember(channelId: string, targetUserId: string, user?: RequestUser): Promise<{
        success: boolean;
    }>;
}
