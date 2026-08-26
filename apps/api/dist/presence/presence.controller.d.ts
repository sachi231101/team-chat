import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import type { RequestUser } from '../common/request-user';
export declare class PresenceController {
    private readonly presenceService;
    constructor(presenceService: PresenceService);
    getAllPresence(user: RequestUser): Promise<{
        userId: string;
        status: string;
        statusMessage?: string;
    }[]>;
    setPresence(user: RequestUser, body: UpdatePresenceDto, userId?: string): Promise<import("@team-chat/shared").User>;
}
