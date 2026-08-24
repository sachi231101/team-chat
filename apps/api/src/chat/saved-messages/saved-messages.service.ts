import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class SavedMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessagesService,
  ) {}

  async listIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.savedMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.messageId);
  }

  async listMessages(userId: string): Promise<Message[]> {
    const rows = await this.prisma.savedMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            sender: true,
            reactions: { include: { user: true } },
            attachments: true,
            replies: { where: { deletedAt: null } },
          },
        },
      },
    });
    return rows
      .filter((r) => r.message && !r.message.deletedAt)
      .map((r) => this.messages.mapMessageToDto(r.message));
  }

  async toggle(userId: string, messageId: string): Promise<{ saved: boolean; ids: string[] }> {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    const existing = await this.prisma.savedMessage.findUnique({
      where: { userId_messageId: { userId, messageId } },
    });

    if (existing) {
      await this.prisma.savedMessage.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.savedMessage.create({ data: { userId, messageId } });
    }

    return { saved: !existing, ids: await this.listIds(userId) };
  }
}
