import { PrismaService } from '../common/prisma.service';
export type SearchScope = 'all' | 'channels' | 'people' | 'messages';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(query: string, userId: string, workplaceId?: string, scope?: SearchScope): Promise<{
        scope: SearchScope;
        messages: {
            id: any;
            content: any;
            senderId: any;
            senderName: any;
            senderAvatar: any;
            channelId: any;
            channelName: any;
            conversationId: any;
            createdAt: any;
            reactions: never[];
            updatedAt: any;
        }[];
        channels: {
            id: any;
            name: any;
            description: any;
            type: any;
            membersCount: undefined;
        }[];
        users: {
            id: any;
            name: any;
            email: any;
            avatarUrl: any;
            title: any;
            status: "online" | "busy" | "away" | "offline";
            workplaceId: any;
            createdAt: any;
        }[];
    }>;
}
