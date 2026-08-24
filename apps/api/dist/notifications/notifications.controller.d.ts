import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(): Promise<import("@team-chat/shared").NotificationItem[]>;
    markAsRead(id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(): Promise<{
        success: boolean;
    }>;
}
