import { MessagesService } from '../messages/messages.service';
import { RequestUser } from '../../common/request-user';
export declare class ReactionsService {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    addReaction(messageId: string, emoji: string, user: RequestUser | string): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
    removeReaction(messageId: string, emoji: string, user: RequestUser | string): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
}
