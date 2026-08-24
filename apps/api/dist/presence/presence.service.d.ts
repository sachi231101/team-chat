import { PrismaService } from '../common/prisma.service';
import { User, UserStatus as SharedUserStatus } from '@team-chat/shared';
export declare class PresenceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAllPresence(workplaceId?: string): Promise<{
        userId: string;
        status: string;
        statusMessage?: string;
    }[]>;
    setPresence(userId: string, status: SharedUserStatus, statusMessage?: string): Promise<User>;
}
