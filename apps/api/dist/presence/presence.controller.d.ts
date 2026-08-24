import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';
export declare class PresenceController {
    private readonly presenceService;
    constructor(presenceService: PresenceService);
    getAllPresence(): Promise<{
        userId: string;
        status: string;
        statusMessage?: string;
    }[]>;
    setPresence(userId: string, body: UpdatePresenceDto): Promise<import("@team-chat/shared").User>;
}
