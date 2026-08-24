import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationItem } from '@team-chat/shared';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string = 'usr-rahul'): Promise<NotificationItem[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        time: this.formatTimeAgo(n.createdAt),
        type: n.type === 'DIRECT_MESSAGE' ? 'dm' : (n.type.toLowerCase() as 'mention' | 'reply' | 'reaction' | 'dm'),
        channelId: n.channelId ?? undefined,
        unread: n.unread,
        createdAt: n.createdAt.toISOString(),
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch notifications: ${(error as Error).message}`,
      );
    }
  }

  async markAsRead(id: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.notification.update({
        where: { id },
        data: { unread: false },
      });
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to mark notification ${id} as read: ${(error as Error).message}`,
      );
    }
  }

  async markAllAsRead(userId: string = 'usr-rahul'): Promise<{ success: boolean }> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId },
        data: { unread: false },
      });
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to mark all notifications as read: ${(error as Error).message}`,
      );
    }
  }

  private formatTimeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
