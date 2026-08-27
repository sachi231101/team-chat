import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RequestUser, DEFAULT_WORKPLACE_ID } from './request-user';
import { ChannelMemberRole, ChannelType } from '@prisma/client';

export type UserContext = RequestUser | { userId: string; workplaceId?: string } | { id: string; workplaceId?: string };

@Injectable()
export class ChatAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private extractUser(
    userOrId: UserContext | string,
    fallbackWorkplaceId?: string,
  ): { userId: string; workplaceId: string; role?: string; permissions?: string[] } {
    if (typeof userOrId === 'string') {
      return {
        userId: userOrId,
        workplaceId: fallbackWorkplaceId || DEFAULT_WORKPLACE_ID,
      };
    }

    const userId = ('userId' in userOrId && userOrId.userId) || ('id' in userOrId && userOrId.id) || '';
    const workplaceId = userOrId.workplaceId || fallbackWorkplaceId || DEFAULT_WORKPLACE_ID;
    const role = 'role' in userOrId ? userOrId.role : undefined;
    const permissions = 'permissions' in userOrId ? userOrId.permissions : undefined;

    return { userId, workplaceId, role, permissions };
  }

  async assertChannelAccess(
    userOrId: UserContext | string,
    channelId: string,
    workplaceId?: string,
  ) {
    const user = this.extractUser(userOrId, workplaceId);

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel || channel.workplaceId !== user.workplaceId) {
      throw new NotFoundException(`Channel ${channelId} not found in this workplace`);
    }

    if (channel.type === ChannelType.PUBLIC) {
      return channel;
    }

    const isMember = channel.members.some((m) => m.userId === user.userId);
    if (!isMember) {
      throw new ForbiddenException(
        'Access denied: You are not a member of this private channel',
      );
    }

    return channel;
  }

  async assertConversationAccess(
    userOrId: UserContext | string,
    conversationId: string,
    workplaceId?: string,
  ) {
    const user = this.extractUser(userOrId, workplaceId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation || conversation.workplaceId !== user.workplaceId) {
      throw new NotFoundException(`Conversation ${conversationId} not found in this workplace`);
    }

    const isParticipant = conversation.participants.some((p) => p.userId === user.userId);
    if (!isParticipant) {
      throw new ForbiddenException(
        'Access denied: You are not a participant in this conversation',
      );
    }

    return conversation;
  }

  async assertMessageAccess(
    userOrId: UserContext | string,
    messageId: string,
    workplaceId?: string,
  ) {
    const user = this.extractUser(userOrId, workplaceId);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true, conversation: true },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    if (message.channelId) {
      await this.assertChannelAccess(user, message.channelId);
    } else if (message.conversationId) {
      await this.assertConversationAccess(user, message.conversationId);
    } else {
      throw new ForbiddenException('Message is not attached to a chat');
    }

    return message;
  }

  async assertMessageModifyAccess(
    userOrId: UserContext | string,
    messageId: string,
    workplaceId?: string,
    allowAdmin = false,
  ) {
    const user = this.extractUser(userOrId, workplaceId);
    const message = await this.assertMessageAccess(user, messageId);

    if (message.senderId === user.userId) {
      return message;
    }

    if (allowAdmin && message.channelId) {
      const channelMember = await this.prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: message.channelId,
            userId: user.userId,
          },
        },
      });
      if (channelMember?.role === ChannelMemberRole.ADMIN) {
        return message;
      }
    }

    throw new ForbiddenException('You can only modify your own messages');
  }

  async assertCanManageChannelMembers(
    userOrId: UserContext | string,
    channelId: string,
    workplaceId?: string,
  ) {
    const user = this.extractUser(userOrId, workplaceId);
    // Membership management always requires membership (public and private).
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel || channel.workplaceId !== user.workplaceId) {
      throw new NotFoundException(`Channel ${channelId} not found in this workplace`);
    }

    const member = channel.members.find((m) => m.userId === user.userId);
    // Creator always retains manage rights; everyone else must be an admin member.
    if (!member && channel.createdById !== user.userId) {
      throw new ForbiddenException(
        'Access denied: You must be a channel member to manage membership',
      );
    }

    const isAdmin =
      channel.createdById === user.userId ||
      member?.role === ChannelMemberRole.ADMIN;
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only channel admins can add or remove other members',
      );
    }

    return channel;
  }

  /** Self-leave / membership check without requiring admin. */
  async assertChannelMembership(
    userOrId: UserContext | string,
    channelId: string,
    workplaceId?: string,
  ) {
    const user = this.extractUser(userOrId, workplaceId);
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel || channel.workplaceId !== user.workplaceId) {
      throw new NotFoundException(`Channel ${channelId} not found in this workplace`);
    }

    const member = channel.members.find((m) => m.userId === user.userId);
    if (!member) {
      throw new ForbiddenException(
        'Access denied: You are not a member of this channel',
      );
    }

    return channel;
  }

  async assertUsersBelongToWorkplace(
    workplaceId: string,
    userIds: string[],
  ): Promise<void> {
    const uniqueIds = Array.from(new Set(userIds));
    if (uniqueIds.length === 0) return;

    const count = await this.prisma.user.count({
      where: {
        id: { in: uniqueIds },
        workplaceId,
      },
    });

    if (count !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more target users do not belong to the current workplace',
      );
    }
  }

  async assertAttachmentAccess(
    userOrId: UserContext | string,
    attachmentIdOrUrl: string,
    workplaceId?: string,
  ) {
    const user = this.extractUser(userOrId, workplaceId);

    const attachment = await this.prisma.attachment.findFirst({
      where: {
        OR: [{ id: attachmentIdOrUrl }, { url: attachmentIdOrUrl }],
      },
      include: {
        message: {
          include: { channel: true, conversation: true },
        },
      },
    });

    if (!attachment || !attachment.message || attachment.message.deletedAt) {
      throw new NotFoundException('Attachment not found');
    }

    await this.assertMessageAccess(user, attachment.message.id);
    return attachment;
  }

  async canJoinChannel(
    userOrId: UserContext | string,
    channelId: string,
    workplaceId?: string,
  ): Promise<boolean> {
    try {
      await this.assertChannelAccess(userOrId, channelId, workplaceId);
      return true;
    } catch {
      return false;
    }
  }

  async canJoinConversation(
    userOrId: UserContext | string,
    conversationId: string,
    workplaceId?: string,
  ): Promise<boolean> {
    try {
      await this.assertConversationAccess(userOrId, conversationId, workplaceId);
      return true;
    } catch {
      return false;
    }
  }
}

