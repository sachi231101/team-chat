import { NotificationsService } from './notifications.service';
import type { RequestUser } from '../common/request-user';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: RequestUser): Promise<import("@team-chat/shared").NotificationItem[]>;
    markAsRead(user: RequestUser, id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(user: RequestUser): Promise<{
        success: boolean;
    }>;
}
