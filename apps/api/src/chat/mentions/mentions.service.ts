import { Injectable } from '@nestjs/common';
import { ChannelType, NotificationType } from '@prisma/client';
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
    let workplaceId = 'wp-teamchat-main';
    let allowedUserIds = new Set<string>();

    if (message.channelId) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: message.channelId },
        include: { members: true },
      });
      if (!channel) return;
      workplaceId = channel.workplaceId;

      if (channel.type === ChannelType.PRIVATE) {
        allowedUserIds = new Set(channel.members.map((m) => m.userId));
      }
    } else if (message.conversationId) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: message.conversationId },
        include: { participants: true },
      });
      if (!conversation) return;
      workplaceId = conversation.workplaceId;
      allowedUserIds = new Set(conversation.participants.map((p) => p.userId));
    }

    const names = this.extractMentions(message.content);
    const users = await this.prisma.user.findMany({
      where: { workplaceId },
    });
    const byName = new Map(users.map((u) => [u.name.toLowerCase(), u]));

    const mentioned = new Set<string>();
    for (const name of names) {
      const user = byName.get(name.toLowerCase());
      if (user && user.id !== message.senderId && !user.id.startsWith('usr-agent-')) {
        // If private channel or DM, only allow if user is in allowedUserIds
        if (allowedUserIds.size > 0 && !allowedUserIds.has(user.id)) {
          continue;
        }
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
      if (
        parent &&
        parent.senderId !== message.senderId &&
        !mentioned.has(parent.senderId) &&
        (allowedUserIds.size === 0 || allowedUserIds.has(parent.senderId))
      ) {
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

