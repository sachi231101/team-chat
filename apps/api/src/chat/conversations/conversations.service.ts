import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Conversation } from '@team-chat/shared';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workplaceId: string = 'wp-teamchat-main', userId?: string): Promise<Conversation[]> {
    try {
      const where: Record<string, unknown> = { workplaceId };
      if (userId) {
        where.participants = {
          some: { userId },
        };
      }

      const convos = await this.prisma.conversation.findMany({
        where,
        include: { participants: true },
        orderBy: { updatedAt: 'desc' },
      });

      return convos.map((c) => ({
        id: c.id,
        participants: c.participants.map((p) => p.userId),
        workplaceId: c.workplaceId,
        unreadCount: 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch conversations: ${(error as Error).message}`,
      );
    }
  }

  async findOne(id: string, workplaceId: string = 'wp-teamchat-main'): Promise<Conversation> {
    try {
      const c = await this.prisma.conversation.findFirst({
        where: { id, workplaceId },
        include: { participants: true },
      });

      if (!c) {
        throw new NotFoundException(`Conversation ${id} not found in workplace ${workplaceId}`);
      }

      return {
        id: c.id,
        participants: c.participants.map((p) => p.userId),
        workplaceId: c.workplaceId,
        unreadCount: 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch conversation ${id}: ${(error as Error).message}`,
      );
    }
  }

  async create(data: { participants: string[]; workplaceId?: string }): Promise<Conversation> {
    const wpId = data.workplaceId || 'wp-teamchat-main';
    const uniqueParticipants = Array.from(new Set(data.participants));

    try {
      const existing = await this.findMatchingConversation(wpId, uniqueParticipants);
      if (existing) return existing;

      const c = await this.prisma.$transaction(async (tx) => {
        return tx.conversation.create({
          data: {
            workplaceId: wpId,
            participants: {
              create: uniqueParticipants.map((userId) => ({ userId })),
            },
          },
          include: { participants: true },
        });
      });

      return {
        id: c.id,
        participants: c.participants.map((p) => p.userId),
        workplaceId: c.workplaceId,
        unreadCount: 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create conversation: ${(error as Error).message}`,
      );
    }
  }

  private async findMatchingConversation(
    workplaceId: string,
    participantIds: string[],
  ): Promise<Conversation | null> {
    const wanted = [...participantIds].sort();
    const convos = await this.prisma.conversation.findMany({
      where: {
        workplaceId,
        participants: { some: { userId: { in: wanted } } },
      },
      include: { participants: true },
    });

    const match = convos.find((c) => {
      const ids = c.participants.map((p) => p.userId).sort();
      return ids.length === wanted.length && ids.every((id, i) => id === wanted[i]);
    });

    if (!match) return null;

    return {
      id: match.id,
      participants: match.participants.map((p) => p.userId),
      workplaceId: match.workplaceId,
      unreadCount: 0,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };
  }
}
