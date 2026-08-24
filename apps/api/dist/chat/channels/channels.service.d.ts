import { PrismaService } from '../../common/prisma.service';
import { Channel, User } from '@team-chat/shared';
export declare class ChannelsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(workplaceId?: string): Promise<Channel[]>;
    findOne(id: string, workplaceId?: string): Promise<Channel>;
    create(data: {
        name: string;
        description?: string;
        topic?: string;
        type: 'public' | 'private';
        createdById?: string;
        workplaceId?: string;
    }): Promise<Channel>;
    getMembers(channelId: string): Promise<User[]>;
    addMembers(channelId: string, userIds: string[]): Promise<User[]>;
    removeMember(channelId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
