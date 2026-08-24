import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChatAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertChannelAccess(userId: string, channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException(`Channel ${channelId} not found`);
    }

    if (channel.type === 'PUBLIC') {
      return;
    }

    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException(
        'Access denied: You are not a member of this private channel',
      );
    }
  }

  async assertConversationAccess(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException(
        'Access denied: You are not a participant in this conversation',
      );
    }
  }

  async assertMessageAccess(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    if (message.channelId) {
      await this.assertChannelAccess(userId, message.channelId);
    } else if (message.conversationId) {
      await this.assertConversationAccess(userId, message.conversationId);
    } else {
      throw new ForbiddenException('Message is not attached to a chat');
    }

    return message;
  }

  async canJoinChannel(userId: string, channelId: string): Promise<boolean> {
    try {
      await this.assertChannelAccess(userId, channelId);
      return true;
    } catch {
      return false;
    }
  }

  async canJoinConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      await this.assertConversationAccess(userId, conversationId);
      return true;
    } catch {
      return false;
    }
  }
}
