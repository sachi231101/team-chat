import { PrismaService } from '../common/prisma.service';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(query: string, workplaceId?: string): Promise<{
        messages: {
            id: string;
            content: string;
            senderId: string;
            senderName: string;
            senderAvatar: string | undefined;
            channelId: string | undefined;
            conversationId: string | undefined;
            createdAt: string;
        }[];
        channels: {
            id: string;
            name: string;
            description: string | undefined;
            type: string;
        }[];
        users: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | undefined;
            title: string | undefined;
        }[];
    }>;
}
