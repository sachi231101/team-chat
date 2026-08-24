import { PrismaService } from '../common/prisma.service';
import { NotificationItem } from '@team-chat/shared';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<NotificationItem[]>;
    markAsRead(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    private formatTimeAgo;
}
