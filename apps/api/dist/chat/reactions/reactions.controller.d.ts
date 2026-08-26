import { ReactionsService } from './reactions.service';
import type { RequestUser } from '../../common/request-user';
export declare class ReactionsController {
    private readonly reactionsService;
    constructor(reactionsService: ReactionsService);
    addReaction(messageId: string, emoji: string, user: RequestUser): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
    removeReaction(messageId: string, emoji: string, user: RequestUser): Promise<{
        success: boolean;
        message: import("@team-chat/shared").Message;
    }>;
}
