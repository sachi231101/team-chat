import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(q: string): Promise<{
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
