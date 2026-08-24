import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { User, UserStatus as SharedUserStatus } from '@team-chat/shared';
import { UserStatus as PrismaUserStatus } from '@prisma/client';

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPresence(workplaceId: string = 'wp-teamchat-main'): Promise<{ userId: string; status: string; statusMessage?: string }[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { workplaceId },
        select: { id: true, status: true, statusMessage: true },
      });

      return users.map((u) => ({
        userId: u.id,
        status: u.status.toLowerCase(),
        statusMessage: u.statusMessage ?? undefined,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch presence: ${(error as Error).message}`,
      );
    }
  }

  async setPresence(
    userId: string,
    status: SharedUserStatus,
    statusMessage?: string,
  ): Promise<User> {
    try {
      const prismaStatus = status.toUpperCase() as PrismaUserStatus;
      const u = await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: prismaStatus,
          statusMessage,
        },
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        title: u.title ?? undefined,
        status: u.status.toLowerCase() as SharedUserStatus,
        statusMessage: u.statusMessage ?? undefined,
        workplaceId: u.workplaceId,
        createdAt: u.createdAt.toISOString(),
      };
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundException(`User ${userId} not found`);
      }
      throw new InternalServerErrorException(
        `Failed to update presence for ${userId}: ${(error as Error).message}`,
      );
    }
  }
}
