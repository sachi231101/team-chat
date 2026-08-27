import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { throwInternal } from '../common/safe-internal-error';
import { NotificationItem } from '@team-chat/shared';
import { isPrismaNotFound } from '../common/prisma-errors';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<NotificationItem[]> {
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
        type:
          n.type === 'DIRECT_MESSAGE'
            ? 'dm'
            : (n.type.toLowerCase() as 'mention' | 'reply' | 'reaction' | 'dm'),
        channelId: n.channelId ?? undefined,
        conversationId: n.conversationId ?? undefined,
        messageId: n.messageId ?? undefined,
        unread: n.unread,
        createdAt: n.createdAt.toISOString(),
      }));
    } catch (error) {
      throwInternal('Failed to fetch notifications', error);
    }
  }

  async markAsRead(id: string, userId: string): Promise<{ success: boolean }> {
    try {
      const existing = await this.prisma.notification.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Notification ${id} not found`);
      }
      await this.prisma.notification.update({
        where: { id },
        data: { unread: false },
      });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (isPrismaNotFound(error)) {
        throw new NotFoundException(`Notification ${id} not found`);
      }
      throwInternal(`Failed to mark notification ${id} as read`, error);
    }
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId },
        data: { unread: false },
      });
      return { success: true };
    } catch (error) {
      throwInternal('Failed to mark all notifications as read', error);
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
