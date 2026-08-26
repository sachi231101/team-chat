import { SearchService } from './search.service';
import type { RequestUser } from '../common/request-user';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(user: RequestUser, q: string): Promise<{
        messages: {
            id: string;
            content: string;
            senderId: string;
            senderName: string;
            senderAvatar: string | undefined;
            channelId: string | undefined;
            channelName: any;
            conversationId: string | undefined;
            createdAt: string;
            reactions: never[];
            updatedAt: string;
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
