import { MessagesService } from '../messages/messages.service';
export declare class ReactionsService {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    addReaction(messageId: string, emoji: string, userId: string): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
    removeReaction(messageId: string, emoji: string, userId: string): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
}
