import { SearchService, SearchScope } from './search.service';
import type { RequestUser } from '../common/request-user';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(user: RequestUser, q: string, scope?: string): Promise<{
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
