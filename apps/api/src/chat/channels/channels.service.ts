import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { RequestUser } from '../../common/request-user';
import { Channel, User } from '@team-chat/shared';
import { ChannelType, ChannelMemberRole, Prisma } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
  ) {}

  async findAll(workplaceId: string = 'wp-teamchat-main', userId?: string): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: {
          workplaceId,
          ...(userId
            ? { OR: [{ type: ChannelType.PUBLIC }, { members: { some: { userId } } }] }
            : {}),
        },
        include: { members: true },
        orderBy: { createdAt: 'asc' },
      });

      return channels.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? undefined,
        topic: c.topic ?? undefined,
        type: c.type === ChannelType.PRIVATE ? 'private' : 'public',
        workplaceId: c.workplaceId,
        createdById: c.createdById,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        unreadCount: 0,
        membersCount: c.members.length,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch channels: ${(error as Error).message}`,
      );
    }
  }

  async findOne(id: string, workplaceId: string = 'wp-teamchat-main'): Promise<Channel> {
    try {
      const c = await this.prisma.channel.findFirst({
        where: { id, workplaceId },
        include: { members: true },
      });

      if (!c) {
        throw new NotFoundException(`Channel ${id} not found in workplace ${workplaceId}`);
      }

      return {
        id: c.id,
        name: c.name,
        description: c.description ?? undefined,
        topic: c.topic ?? undefined,
        type: c.type === ChannelType.PRIVATE ? 'private' : 'public',
        workplaceId: c.workplaceId,
        createdById: c.createdById,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        unreadCount: 0,
        membersCount: c.members.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch channel ${id}: ${(error as Error).message}`,
      );
    }
  }

  async create(data: {
    name: string;
    description?: string;
    topic?: string;
    type: 'public' | 'private';
    createdById?: string;
    workplaceId?: string;
  }): Promise<Channel> {
    const creatorId = data.createdById;
    if (!creatorId) {
      throw new InternalServerErrorException('createdById is required');
    }
    const wpId = data.workplaceId || 'wp-teamchat-main';
    const normalizedName = data.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const channel = await tx.channel.create({
          data: {
            name: normalizedName,
            description: data.description,
            topic: data.topic,
            type: data.type === 'private' ? ChannelType.PRIVATE : ChannelType.PUBLIC,
            createdById: creatorId,
            workplaceId: wpId,
            members: {
              create: {
                userId: creatorId,
                role: ChannelMemberRole.ADMIN,
              },
            },
          },
          include: { members: true },
        });

        return channel;
      });

      return {
        id: result.id,
        name: result.name,
        description: result.description ?? undefined,
        topic: result.topic ?? undefined,
        type: result.type === ChannelType.PRIVATE ? 'private' : 'public',
        workplaceId: result.workplaceId,
        createdById: result.createdById,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        unreadCount: 0,
        membersCount: result.members.length,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Channel #${normalizedName} already exists`);
      }
      throw new InternalServerErrorException(
        `Failed to create channel: ${(error as Error).message}`,
      );
    }
  }

  async getMembers(channelId: string, user?: RequestUser): Promise<User[]> {
    try {
      if (user) {
        await this.chatAccess.assertChannelAccess(user, channelId);
      }

      const members = await this.prisma.channelMember.findMany({
        where: { channelId },
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      });

      return members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl ?? undefined,
        title: m.user.title ?? undefined,
        status: m.user.status.toLowerCase() as 'online' | 'busy' | 'away' | 'offline',
        statusMessage: m.user.statusMessage ?? undefined,
        workplaceId: m.user.workplaceId,
        createdAt: m.user.createdAt.toISOString(),
      }));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch channel members: ${(error as Error).message}`,
      );
    }
  }

  async addMembers(channelId: string, userIds: string[], user?: RequestUser): Promise<User[]> {
    try {
      if (user) {
        await this.chatAccess.assertCanManageChannelMembers(user, channelId);
        await this.chatAccess.assertUsersBelongToWorkplace(user.workplaceId, userIds);
      }

      await this.prisma.$transaction(
        userIds.map((userId) =>
          this.prisma.channelMember.upsert({
            where: {
              channelId_userId: { channelId, userId },
            },
            create: { channelId, userId, role: ChannelMemberRole.MEMBER },
            update: {},
          }),
        ),
      );

      return this.getMembers(channelId, user);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(
        `Failed to add channel members: ${(error as Error).message}`,
      );
    }
  }

  async removeMember(channelId: string, targetUserId: string, user?: RequestUser): Promise<{ success: boolean }> {
    try {
      if (user) {
        const channel = await this.chatAccess.assertChannelAccess(user, channelId);
        // Verify target user belongs to same workplace
        await this.chatAccess.assertUsersBelongToWorkplace(user.workplaceId, [targetUserId]);

        // If removing someone else, must be admin
        if (user.userId !== targetUserId) {
          const callerMember = channel.members.find((m) => m.userId === user.userId);
          if (callerMember?.role !== ChannelMemberRole.ADMIN && channel.createdById !== user.userId) {
            throw new ForbiddenException('Only channel admins can remove other members');
          }
        }
      }

      await this.prisma.channelMember.deleteMany({
        where: { channelId, userId: targetUserId },
      });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(
        `Failed to remove channel member: ${(error as Error).message}`,
      );
    }
  }
}

