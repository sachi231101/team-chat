import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { throwInternal } from '../../common/safe-internal-error';
import { Conversation } from '@team-chat/shared';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
  ) {}

  async findAll(workplaceId: string = 'ws-acme-hq-dev', userId?: string): Promise<Conversation[]> {
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
      throwInternal('Failed to fetch conversations', error);
    }
  }

  async findOne(id: string, workplaceId: string = 'ws-acme-hq-dev'): Promise<Conversation> {
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
      throwInternal('Failed to fetch conversation', error);
    }
  }

  async create(data: { participants: string[]; workplaceId?: string }): Promise<Conversation> {
    const wpId = data.workplaceId || 'ws-acme-hq-dev';
    const uniqueParticipants = Array.from(new Set(data.participants));

    try {
      await this.chatAccess.assertUsersBelongToWorkplace(wpId, uniqueParticipants);

      // Serializable find-or-create reduces duplicate DMs under concurrent creates.
      const conversation = await this.prisma.$transaction(
        async (tx) => {
          const existing = await this.findMatchingConversationTx(tx, wpId, uniqueParticipants);
          if (existing) return existing;

          return tx.conversation.create({
            data: {
              workplaceId: wpId,
              participants: {
                create: uniqueParticipants.map((userId) => ({ userId })),
              },
            },
            include: { participants: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return {
        id: conversation.id,
        participants: conversation.participants.map((p) => p.userId),
        workplaceId: conversation.workplaceId,
        unreadCount: 0,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;

      // Concurrent serializable transactions may conflict — retry once as find.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        const existing = await this.findMatchingConversation(wpId, uniqueParticipants);
        if (existing) return existing;
      }

      throwInternal('Failed to create conversation', error);
    }
  }

  private async findMatchingConversation(
    workplaceId: string,
    participantIds: string[],
  ): Promise<Conversation | null> {
    const match = await this.findMatchingConversationTx(this.prisma, workplaceId, participantIds);
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

  private async findMatchingConversationTx(
    db: Prisma.TransactionClient | PrismaService,
    workplaceId: string,
    participantIds: string[],
  ) {
    const wanted = [...participantIds].sort();
    const convos = await db.conversation.findMany({
      where: {
        workplaceId,
        participants: { some: { userId: { in: wanted } } },
      },
      include: { participants: true },
    });

    return (
      convos.find((c) => {
        const ids = c.participants.map((p) => p.userId).sort();
        return ids.length === wanted.length && ids.every((id, i) => id === wanted[i]);
      }) ?? null
    );
  }
}
