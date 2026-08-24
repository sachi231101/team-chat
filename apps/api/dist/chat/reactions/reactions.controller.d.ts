import { ReactionsService } from './reactions.service';
export declare class ReactionsController {
    private readonly reactionsService;
    constructor(reactionsService: ReactionsService);
    addReaction(messageId: string, emoji: string, user: {
        id: string;
    }): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
    removeReaction(messageId: string, emoji: string, user: {
        id: string;
    }): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
}
