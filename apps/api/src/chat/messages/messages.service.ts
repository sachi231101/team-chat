import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  Prisma,
  Message as PrismaMessage,
  User,
  MessageReaction,
  Attachment,
  MessageTag,
  ActionItem,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService, UserContext } from '../../common/chat-access.service';
import { throwInternal } from '../../common/safe-internal-error';
import { RequestUser, DEFAULT_WORKPLACE_ID } from '../../common/request-user';
import { Message } from '@team-chat/shared';
import { CreateMessageDto } from './dto/create-message.dto';
import { RealtimeService } from '../../realtime/realtime.service';
import { MentionsService } from '../mentions/mentions.service';
import { AiOrchestratorService } from '../../ai/ai-orchestrator.service';

type MessageWithRelations = PrismaMessage & {
  sender: User | null;
  reactions: (MessageReaction & { user: User | null })[];
  attachments: Attachment[];
  replies?: PrismaMessage[];
  tags?: (MessageTag & { user: User | null })[];
  actionItems?: (ActionItem & { assignee?: User | null; creator?: User | null })[];
};

export interface MessageListResult {
  items: Message[];
  nextCursor: string | null;
  lastReadMessageId: string | null;
}

const MESSAGE_INCLUDE = {
  sender: true,
  reactions: { include: { user: true } },
  attachments: true,
  tags: { include: { user: true } },
  actionItems: { include: { assignee: true, creator: true } },
  poll: {
    include: {
      creator: true,
      votes: {
        include: {
          user: true,
        },
      },
    },
  },
  replies: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' as const },
  },
};


@Injectable()
export class MessagesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagesService.name);
  private scheduleTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    private readonly realtime: RealtimeService,
    private readonly mentions: MentionsService,
    @Inject(forwardRef(() => AiOrchestratorService))
    private readonly ai: AiOrchestratorService,
  ) {}

  onModuleInit(): void {
    this.scheduleTimer = setInterval(() => {
      void this.publishDueScheduledMessages().catch((err) =>
        this.logger.warn(`Scheduled message publish failed: ${(err as Error).message}`),
      );
    }, 20_000);
  }

  onModuleDestroy(): void {
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
  }

  /** Pending schedules stay hidden until the publisher clears `scheduledFor`. */
  private visibleMessageFilter(): Prisma.MessageWhereInput {
    return { scheduledFor: null };
  }

  private extractUser(userOrId: UserContext | string): { userId: string; workplaceId: string } {
    if (typeof userOrId === 'string') {
      return { userId: userOrId, workplaceId: DEFAULT_WORKPLACE_ID };
    }
    const userId = ('userId' in userOrId && userOrId.userId) || ('id' in userOrId && userOrId.id) || '';
    const workplaceId = userOrId.workplaceId || DEFAULT_WORKPLACE_ID;
    return { userId, workplaceId };
  }

  async findAll(
    userOrId: UserContext | string,
    channelId?: string,
    conversationId?: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<MessageListResult> {
    const user = this.extractUser(userOrId);
    if (!channelId && !conversationId) {
      throw new BadRequestException('channelId or conversationId is required');
    }

    try {
      if (channelId) {
        await this.chatAccess.assertChannelAccess(user, channelId);
      }
      if (conversationId) {
        await this.chatAccess.assertConversationAccess(user, conversationId);
      }

      const where: Prisma.MessageWhereInput = {
        deletedAt: null,
        parentMessageId: null,
        ...this.visibleMessageFilter(),
      };
      if (channelId) where.channelId = channelId;
      if (conversationId) where.conversationId = conversationId;

      const take = Math.min(Math.max(Number(limit) || 50, 1), 100);

      const rows = await this.prisma.message.findMany({
        where,
        take: take + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: MESSAGE_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      const hasMore = rows.length > take;
      const page = hasMore ? rows.slice(0, take) : rows;
      const chronological = [...page].reverse();

      const lastRead = await this.prisma.readReceipt.findFirst({
        where: {
          userId: user.userId,
          message: channelId ? { channelId } : { conversationId },
        },
        orderBy: { readAt: 'desc' },
        include: { message: { select: { id: true, createdAt: true } } },
      });

      return {
        items: chronological.map((m) => this.mapMessageToDto(m as any)),
        nextCursor: hasMore ? page[page.length - 1].id : null,
        lastReadMessageId: lastRead?.messageId ?? null,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throwInternal('Failed to fetch messages', error);
    }
  }

  async syncSince(
    userOrId: UserContext | string,
    channelId?: string,
    conversationId?: string,
    since?: string,
  ): Promise<Message[]> {
    const user = this.extractUser(userOrId);
    if (!channelId && !conversationId) {
      throw new BadRequestException('channelId or conversationId is required');
    }

    try {
      if (channelId) {
        await this.chatAccess.assertChannelAccess(user, channelId);
      }
      if (conversationId) {
        await this.chatAccess.assertConversationAccess(user, conversationId);
      }

      const where: Prisma.MessageWhereInput = {
        deletedAt: null,
        ...this.visibleMessageFilter(),
      };
      if (channelId) where.channelId = channelId;
      if (conversationId) where.conversationId = conversationId;
      if (since) {
        where.updatedAt = { gt: new Date(since) };
      }

      const rows = await this.prisma.message.findMany({
        where,
        include: MESSAGE_INCLUDE,
        orderBy: { updatedAt: 'asc' },
        take: 100,
      });

      return rows.map((m) => this.mapMessageToDto(m as any));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throwInternal('Failed to sync messages', error);
    }
  }

  async findOne(id: string, userOrId?: UserContext | string): Promise<Message> {
    try {
      if (userOrId) {
        await this.chatAccess.assertMessageAccess(userOrId, id);
      }

      const m = await this.prisma.message.findUnique({
        where: { id },
        include: MESSAGE_INCLUDE,
      });

      if (!m || m.deletedAt) {
        throw new NotFoundException(`Message ${id} not found`);
      }

      return this.mapMessageToDto(m as any);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to fetch message', error);
    }
  }

  async create(userOrId: UserContext | string, body: CreateMessageDto): Promise<Message> {
    const user = this.extractUser(userOrId);
    const hasChannel = Boolean(body.channelId);
    const hasConversation = Boolean(body.conversationId);
    if (hasChannel === hasConversation) {
      throw new BadRequestException(
        'Provide exactly one of channelId or conversationId',
      );
    }

    if (body.channelId) {
      await this.chatAccess.assertChannelAccess(user, body.channelId);
    }
    if (body.conversationId) {
      await this.chatAccess.assertConversationAccess(user, body.conversationId);
    }
    if (body.parentMessageId) {
      await this.chatAccess.assertMessageAccess(user, body.parentMessageId);
    }

    // Strict Idempotency Check: if clientMessageId already processed, return existing message
    if (body.clientMessageId) {
      const existing = await this.prisma.message.findFirst({
        where: { clientMessageId: body.clientMessageId },
        include: MESSAGE_INCLUDE,
      });
      if (existing) {
        return this.mapMessageToDto(existing as any);
      }
    }

    const trimmedContent = body.content?.trim() ?? '';
    if (!trimmedContent && (!body.attachments || body.attachments.length === 0)) {
      throw new BadRequestException('Message must include text or at least one attachment');
    }

    let scheduledFor: Date | null = null;
    if (body.scheduledFor) {
      const when = new Date(body.scheduledFor);
      if (Number.isNaN(when.getTime())) {
        throw new BadRequestException('scheduledFor must be a valid ISO datetime');
      }
      if (when.getTime() <= Date.now() + 30_000) {
        throw new BadRequestException('scheduledFor must be at least 30 seconds in the future');
      }
      if (when.getTime() > Date.now() + 365 * 24 * 60 * 60 * 1000) {
        throw new BadRequestException('scheduledFor cannot be more than 1 year ahead');
      }
      scheduledFor = when;
    }

    try {
      const m = await this.prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            clientMessageId: body.clientMessageId,
            content: trimmedContent,
            senderId: user.userId,
            channelId: body.channelId,
            conversationId: body.conversationId,
            parentMessageId: body.parentMessageId,
            scheduledFor,
            // Keep timeline order correct when the message becomes visible
            ...(scheduledFor ? { createdAt: scheduledFor } : {}),
            attachments:
              body.attachments && body.attachments.length > 0
                ? {
                    create: body.attachments.map((a) => ({
                      name: a.name,
                      size: Math.round(a.size),
                      type: a.type,
                      url: a.url,
                    })),
                  }
                : undefined,
          },
          include: MESSAGE_INCLUDE,
        });

        if (!scheduledFor) {
          if (body.conversationId) {
            await tx.conversation.update({
              where: { id: body.conversationId },
              data: { updatedAt: new Date() },
            });
          }

          if (body.channelId) {
            await tx.channel.update({
              where: { id: body.channelId },
              data: { updatedAt: new Date() },
            });
          }
        }

        return created;
      });

      const dto = this.mapMessageToDto(m as any);
      if (scheduledFor) {
        return dto;
      }

      this.realtime.emitToChat(dto, 'message:created', dto);
      void this.mentions.notifyFromMessage(dto);
      this.ai.onMessageCreated(dto);
      return dto;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throwInternal('Failed to create message', error);
    }
  }

  async publishDueScheduledMessages(): Promise<number> {
    const due = await this.prisma.message.findMany({
      where: {
        deletedAt: null,
        scheduledFor: { lte: new Date() },
      },
      include: MESSAGE_INCLUDE,
      take: 50,
      orderBy: { scheduledFor: 'asc' },
    });

    let published = 0;
    for (const row of due) {
      const updated = await this.prisma.message.update({
        where: { id: row.id },
        data: {
          scheduledFor: null,
          createdAt: row.scheduledFor ?? new Date(),
          updatedAt: new Date(),
        },
        include: MESSAGE_INCLUDE,
      });

      if (updated.channelId) {
        await this.prisma.channel.update({
          where: { id: updated.channelId },
          data: { updatedAt: new Date() },
        });
      }
      if (updated.conversationId) {
        await this.prisma.conversation.update({
          where: { id: updated.conversationId },
          data: { updatedAt: new Date() },
        });
      }

      const dto = this.mapMessageToDto(updated as any);
      this.realtime.emitToChat(dto, 'message:created', dto);
      void this.mentions.notifyFromMessage(dto);
      this.ai.onMessageCreated(dto);
      published += 1;
    }
    return published;
  }

  async update(id: string, content: string, userOrId: UserContext | string): Promise<Message> {
    try {
      await this.chatAccess.assertMessageModifyAccess(userOrId, id, undefined, false);

      const m = await this.prisma.message.update({
        where: { id },
        data: { content, editedAt: new Date() },
        include: MESSAGE_INCLUDE,
      });

      const dto = this.mapMessageToDto(m as any);
      this.realtime.emitToChat(dto, 'message:updated', dto);
      return dto;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throwInternal('Failed to update message', error);
    }
  }

  async delete(id: string, userOrId: UserContext | string): Promise<{ success: boolean }> {
    try {
      const existing = await this.chatAccess.assertMessageModifyAccess(userOrId, id, undefined, true);

      await this.prisma.message.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          content: 'This message was deleted.',
        },
      });

      this.realtime.emitToChat(existing, 'message:deleted', { id });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throwInternal('Failed to delete message', error);
    }
  }

  async togglePin(id: string, userOrId?: UserContext | string): Promise<Message> {
    try {
      if (userOrId) {
        await this.chatAccess.assertMessageAccess(userOrId, id);
      }

      const current = await this.prisma.message.findUnique({ where: { id } });
      if (!current || current.deletedAt) {
        throw new NotFoundException(`Message ${id} not found`);
      }

      const m = await this.prisma.message.update({
        where: { id },
        data: { pinned: !current.pinned },
        include: MESSAGE_INCLUDE,
      });

      const dto = this.mapMessageToDto(m as any);
      this.realtime.emitToChat(dto, 'pin:toggled', { messageId: id, message: dto });
      return dto;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to toggle pin', error);
    }
  }

  async toggleReaction(messageId: string, emoji: string, userOrId: UserContext | string): Promise<Message> {
    const user = this.extractUser(userOrId);
    try {
      await this.chatAccess.assertMessageAccess(user, messageId);

      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId: user.userId,
              emoji,
            },
          },
        });

        if (existing) {
          await tx.messageReaction.delete({
            where: { id: existing.id },
          });
        } else {
          await tx.messageReaction.create({
            data: {
              messageId,
              userId: user.userId,
              emoji,
            },
          });
        }
      });

      const dto = await this.findOne(messageId, user);
      this.realtime.emitToChat(dto, 'reaction:toggled', {
        messageId,
        message: dto,
      });
      return dto;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to toggle reaction', error);
    }
  }

  async getReplies(parentMessageId: string, userOrId?: UserContext | string): Promise<Message[]> {
    try {
      if (userOrId) {
        await this.chatAccess.assertMessageAccess(userOrId, parentMessageId);
      }

      const replies = await this.prisma.message.findMany({
        where: {
          parentMessageId,
          deletedAt: null,
        },
        include: MESSAGE_INCLUDE,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      return replies.map((r) => this.mapMessageToDto(r as any));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to fetch replies', error);
    }
  }

  async markAsRead(messageId: string, userOrId: UserContext | string): Promise<{ success: boolean }> {
    const user = this.extractUser(userOrId);
    try {
      await this.chatAccess.assertMessageAccess(user, messageId);

      await this.prisma.readReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: user.userId,
          },
        },
        create: {
          messageId,
          userId: user.userId,
        },
        update: {
          readAt: new Date(),
        },
      });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to mark message as read', error);
    }
  }

  async findPinnedForUser(userOrId: UserContext | string): Promise<Message[]> {
    const user = this.extractUser(userOrId);
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId: user.userId },
      select: { channelId: true },
    });
    const convos = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.userId },
      select: { conversationId: true },
    });
    const rows = await this.prisma.message.findMany({
      where: {
        pinned: true,
        deletedAt: null,
        OR: [
          { channel: { workplaceId: user.workplaceId, type: 'PUBLIC' } },
          { channel: { workplaceId: user.workplaceId }, channelId: { in: memberships.map((m) => m.channelId) } },
          { conversation: { workplaceId: user.workplaceId }, conversationId: { in: convos.map((c) => c.conversationId) } },
        ],
      },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((m) => this.mapMessageToDto(m as any));
  }

  async findPinned(channelId?: string, conversationId?: string, userOrId?: UserContext | string): Promise<Message[]> {
    if (!channelId && !conversationId) {
      throw new BadRequestException('channelId or conversationId is required');
    }
    if (userOrId) {
      if (channelId) await this.chatAccess.assertChannelAccess(userOrId, channelId);
      if (conversationId) await this.chatAccess.assertConversationAccess(userOrId, conversationId);
    }
    const where: Prisma.MessageWhereInput = {
      pinned: true,
      deletedAt: null,
      ...this.visibleMessageFilter(),
    };
    if (channelId) where.channelId = channelId;
    if (conversationId) where.conversationId = conversationId;

    const rows = await this.prisma.message.findMany({
      where,
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((m) => this.mapMessageToDto(m as any));
  }

  mapMessageToDto(m: MessageWithRelations): Message {
    return {
      id: m.id,
      clientMessageId: m.clientMessageId ?? undefined,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender?.name || 'Unknown',
      senderAvatar: m.sender?.avatarUrl ?? undefined,
      channelId: m.channelId ?? undefined,
      conversationId: m.conversationId ?? undefined,
      parentMessageId: m.parentMessageId ?? undefined,
      pinned: m.pinned,
      scheduledFor: m.scheduledFor?.toISOString(),
      editedAt: m.editedAt?.toISOString(),
      replyCount: m.replies ? m.replies.length : 0,
      lastReplyAt:
        m.replies && m.replies.length > 0
          ? m.replies[m.replies.length - 1].createdAt.toISOString()
          : undefined,
      reactions: m.reactions
        ? m.reactions.map((r) => ({
            id: r.id,
            emoji: r.emoji,
            userId: r.userId,
            userName: r.user?.name || 'Team Member',
            createdAt: r.createdAt.toISOString(),
          }))
        : [],
      attachments: m.attachments
        ? m.attachments.map((a) => ({
            id: a.id,
            name: a.name,
            size: a.size,
            type: a.type,
            url: a.url,
            createdAt: a.createdAt.toISOString(),
          }))
        : [],
      tags: m.tags
        ? m.tags.map((t) => ({
            id: t.id,
            messageId: t.messageId,
            userId: t.userId,
            userName: t.user?.name || 'Team Member',
            tag: t.tag as any,
            note: t.note ?? undefined,
            createdAt: t.createdAt.toISOString(),
          }))
        : [],
      actionItems: m.actionItems
        ? m.actionItems.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description ?? undefined,
            status: a.status as any,
            dueDate: a.dueDate?.toISOString(),
            assigneeId: a.assigneeId ?? undefined,
            assigneeName: a.assignee?.name ?? undefined,
            assigneeAvatar: a.assignee?.avatarUrl ?? undefined,
            creatorId: a.creatorId,
            creatorName: a.creator?.name ?? undefined,
            messageId: a.messageId ?? undefined,
            channelId: a.channelId ?? undefined,
            conversationId: a.conversationId ?? undefined,
            workplaceId: a.workplaceId,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          }))
        : [],
      poll: (m as any).poll
        ? {
            id: (m as any).poll.id,
            question: (m as any).poll.question,
            options: (m as any).poll.options.map((text: string, index: number) => {
              const votes = ((m as any).poll.votes || []).filter(
                (v: any) => v.optionIndex === index,
              );
              const voteCount = votes.length;
              const totalVotes = ((m as any).poll.votes || []).length;
              const percentage =
                totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              return {
                index,
                text,
                voteCount,
                percentage,
                voters: (m as any).poll.isAnonymous
                  ? undefined
                  : votes.map((v: any) => ({
                      id: v.user?.id || v.userId,
                      name: v.user?.name || 'Team Member',
                      avatarUrl: v.user?.avatarUrl,
                    })),
              };
            }),
            totalVotes: ((m as any).poll.votes || []).length,
            totalVoters: new Set(
              ((m as any).poll.votes || []).map((v: any) => v.userId),
            ).size,
            isMultiChoice: (m as any).poll.isMultiChoice,
            isAnonymous: (m as any).poll.isAnonymous,
            isClosed: (m as any).poll.isClosed,
            createdById: (m as any).poll.createdById,
            creatorName: (m as any).poll.creator?.name,
            createdAt: (m as any).poll.createdAt?.toISOString(),
          }
        : undefined,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}

