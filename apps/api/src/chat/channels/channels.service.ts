import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Channel, User } from '@team-chat/shared';
import { ChannelType } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workplaceId: string = 'wp-teamchat-main'): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: { workplaceId },
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
    const creatorId = data.createdById || 'usr-rahul';
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
                role: 'admin',
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
      throw new InternalServerErrorException(
        `Failed to create channel: ${(error as Error).message}`,
      );
    }
  }

  async getMembers(channelId: string): Promise<User[]> {
    try {
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
      throw new InternalServerErrorException(
        `Failed to fetch channel members: ${(error as Error).message}`,
      );
    }
  }

  async addMembers(channelId: string, userIds: string[]): Promise<User[]> {
    try {
      await this.prisma.$transaction(
        userIds.map((userId) =>
          this.prisma.channelMember.upsert({
            where: {
              channelId_userId: { channelId, userId },
            },
            create: { channelId, userId, role: 'member' },
            update: {},
          }),
        ),
      );

      return this.getMembers(channelId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to add channel members: ${(error as Error).message}`,
      );
    }
  }

  async removeMember(channelId: string, userId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.channelMember.deleteMany({
        where: { channelId, userId },
      });
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to remove channel member: ${(error as Error).message}`,
      );
    }
  }
}
