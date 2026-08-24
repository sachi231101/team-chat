import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';

@Injectable()
export class MentionsService {
  constructor(private readonly prisma: PrismaService) {}

  extractMentions(content: string): string[] {
    const mentionRegex = /@([\w.\- ]+?)(?=\s|$|[.,!?;:])/g;
    const names: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      names.push(match[1].trim());
    }
    return names;
  }

  async notifyFromMessage(message: Message): Promise<void> {
    const names = this.extractMentions(message.content);
    const users = await this.prisma.user.findMany();
    const byName = new Map(users.map((u) => [u.name.toLowerCase(), u]));

    const mentioned = new Set<string>();
    for (const name of names) {
      const user = byName.get(name.toLowerCase());
      if (user && user.id !== message.senderId) {
        mentioned.add(user.id);
      }
    }

    for (const userId of mentioned) {
      await this.prisma.notification.create({
        data: {
          userId,
          title: `${message.senderName} mentioned you`,
          body: message.content.slice(0, 180),
          type: NotificationType.MENTION,
          channelId: message.channelId,
          conversationId: message.conversationId,
          messageId: message.id,
        },
      });
    }

    if (message.parentMessageId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: message.parentMessageId },
      });
      if (parent && parent.senderId !== message.senderId && !mentioned.has(parent.senderId)) {
        await this.prisma.notification.create({
          data: {
            userId: parent.senderId,
            title: `${message.senderName} replied to your message`,
            body: message.content.slice(0, 180),
            type: NotificationType.REPLY,
            channelId: message.channelId,
            conversationId: message.conversationId,
            messageId: message.id,
          },
        });
      }
    }

    if (message.conversationId && !message.parentMessageId) {
      const participants = await this.prisma.conversationParticipant.findMany({
        where: { conversationId: message.conversationId },
      });
      for (const p of participants) {
        if (p.userId === message.senderId || mentioned.has(p.userId)) continue;
        await this.prisma.notification.create({
          data: {
            userId: p.userId,
            title: `New message from ${message.senderName}`,
            body: message.content.slice(0, 180),
            type: NotificationType.DIRECT_MESSAGE,
            conversationId: message.conversationId,
            messageId: message.id,
          },
        });
      }
    }
  }
}
