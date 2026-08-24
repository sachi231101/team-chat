import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Message as PrismaMessage, User, MessageReaction, Attachment } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';
import { CreateMessageDto } from './dto/create-message.dto';
import { RealtimeService } from '../../realtime/realtime.service';
import { MentionsService } from '../mentions/mentions.service';

type MessageWithRelations = PrismaMessage & {
  sender: User | null;
  reactions: (MessageReaction & { user: User | null })[];
  attachments: Attachment[];
  replies?: PrismaMessage[];
};

export interface MessageListResult {
  items: Message[];
  nextCursor: string | null;
  lastReadMessageId: string | null;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly mentions: MentionsService,
  ) {}

  async findAll(
    userId: string,
    channelId?: string,
    conversationId?: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<MessageListResult> {
    if (!channelId && !conversationId) {
      throw new BadRequestException('channelId or conversationId is required');
    }

    try {
      const where: Prisma.MessageWhereInput = {
        deletedAt: null,
        parentMessageId: null,
      };
      if (channelId) where.channelId = channelId;
      if (conversationId) where.conversationId = conversationId;

      const take = Math.min(Math.max(Number(limit) || 50, 1), 100);

      const rows = await this.prisma.message.findMany({
        where,
        take: take + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: {
          sender: true,
          reactions: { include: { user: true } },
          attachments: true,
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      const hasMore = rows.length > take;
      const page = hasMore ? rows.slice(0, take) : rows;
      const chronological = [...page].reverse();

      const lastRead = await this.prisma.readReceipt.findFirst({
        where: {
          userId,
          message: channelId ? { channelId } : { conversationId },
        },
        orderBy: { readAt: 'desc' },
        include: { message: { select: { id: true, createdAt: true } } },
      });

      return {
        items: chronological.map((m) => this.mapMessageToDto(m)),
        nextCursor: hasMore ? page[page.length - 1].id : null,
        lastReadMessageId: lastRead?.messageId ?? null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch messages: ${(error as Error).message}`,
      );
    }
  }

  async findOne(id: string): Promise<Message> {
    try {
      const m = await this.prisma.message.findUnique({
        where: { id },
        include: {
          sender: true,
          reactions: { include: { user: true } },
          attachments: true,
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!m || m.deletedAt) {
        throw new NotFoundException(`Message ${id} not found`);
      }

      return this.mapMessageToDto(m);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch message ${id}: ${(error as Error).message}`,
      );
    }
  }

  async create(userId: string, body: CreateMessageDto): Promise<Message> {
    const hasChannel = Boolean(body.channelId);
    const hasConversation = Boolean(body.conversationId);
    if (hasChannel === hasConversation) {
      throw new BadRequestException(
        'Provide exactly one of channelId or conversationId',
      );
    }

    try {
      const m = await this.prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            content: body.content,
            senderId: userId,
            channelId: body.channelId,
            conversationId: body.conversationId,
            parentMessageId: body.parentMessageId,
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
          include: {
            sender: true,
            reactions: { include: { user: true } },
            attachments: true,
            replies: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

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

        return created;
      });

      const dto = this.mapMessageToDto(m);
      this.realtime.emitToChat(dto, 'message:created', dto);
      void this.mentions.notifyFromMessage(dto);
      return dto;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Failed to create message: ${(error as Error).message}`,
      );
    }
  }

  async update(id: string, content: string, userId: string): Promise<Message> {
    try {
      const existing = await this.prisma.message.findUnique({ where: { id } });
      if (!existing || existing.deletedAt) {
        throw new NotFoundException(`Message ${id} not found`);
      }
      if (existing.senderId !== userId) {
        throw new ForbiddenException('You can only edit your own messages');
      }

      const m = await this.prisma.message.update({
        where: { id },
        data: { content, editedAt: new Date() },
        include: {
          sender: true,
          reactions: { include: { user: true } },
          attachments: true,
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      const dto = this.mapMessageToDto(m);
      this.realtime.emitToChat(dto, 'message:updated', dto);
      return dto;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update message ${id}: ${(error as Error).message}`,
      );
    }
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    try {
      const existing = await this.prisma.message.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Message ${id} not found`);
      }
      if (existing.senderId !== userId) {
        throw new ForbiddenException('You can only delete your own messages');
      }

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
      throw new InternalServerErrorException(
        `Failed to delete message ${id}: ${(error as Error).message}`,
      );
    }
  }

  async togglePin(id: string): Promise<Message> {
    try {
      const current = await this.prisma.message.findUnique({ where: { id } });
      if (!current || current.deletedAt) {
        throw new NotFoundException(`Message ${id} not found`);
      }

      const m = await this.prisma.message.update({
        where: { id },
        data: { pinned: !current.pinned },
        include: {
          sender: true,
          reactions: { include: { user: true } },
          attachments: true,
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      const dto = this.mapMessageToDto(m);
      this.realtime.emitToChat(dto, 'pin:toggled', { messageId: id, message: dto });
      return dto;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to toggle pin for message ${id}: ${(error as Error).message}`,
      );
    }
  }

  async toggleReaction(messageId: string, emoji: string, userId: string): Promise<Message> {
    try {
      const message = await this.prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.deletedAt) {
        throw new NotFoundException(`Message ${messageId} not found`);
      }

      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId,
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
              userId,
              emoji,
            },
          });
        }
      });

      const dto = await this.findOne(messageId);
      this.realtime.emitToChat(dto, 'reaction:toggled', {
        messageId,
        message: dto,
      });
      return dto;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to toggle reaction on message ${messageId}: ${(error as Error).message}`,
      );
    }
  }

  async getReplies(parentMessageId: string): Promise<Message[]> {
    try {
      const replies = await this.prisma.message.findMany({
        where: {
          parentMessageId,
          deletedAt: null,
        },
        include: {
          sender: true,
          reactions: { include: { user: true } },
          attachments: true,
          replies: true,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      return replies.map((r) => this.mapMessageToDto(r));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch replies: ${(error as Error).message}`,
      );
    }
  }

  async markAsRead(messageId: string, userId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.readReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
        create: {
          messageId,
          userId,
        },
        update: {
          readAt: new Date(),
        },
      });
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to mark message as read: ${(error as Error).message}`,
      );
    }
  }

  async findPinnedForUser(userId: string): Promise<Message[]> {
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });
    const convos = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const rows = await this.prisma.message.findMany({
      where: {
        pinned: true,
        deletedAt: null,
        OR: [
          { channel: { type: 'PUBLIC' } },
          { channelId: { in: memberships.map((m) => m.channelId) } },
          { conversationId: { in: convos.map((c) => c.conversationId) } },
        ],
      },
      include: {
        sender: true,
        reactions: { include: { user: true } },
        attachments: true,
        replies: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((m) => this.mapMessageToDto(m));
  }

  async findPinned(channelId?: string, conversationId?: string): Promise<Message[]> {
    if (!channelId && !conversationId) {
      throw new BadRequestException('channelId or conversationId is required');
    }
    const where: Prisma.MessageWhereInput = {
      pinned: true,
      deletedAt: null,
    };
    if (channelId) where.channelId = channelId;
    if (conversationId) where.conversationId = conversationId;

    const rows = await this.prisma.message.findMany({
      where,
      include: {
        sender: true,
        reactions: { include: { user: true } },
        attachments: true,
        replies: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((m) => this.mapMessageToDto(m));
  }

  mapMessageToDto(m: MessageWithRelations): Message {
    return {
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender?.name || 'Unknown',
      senderAvatar: m.sender?.avatarUrl ?? undefined,
      channelId: m.channelId ?? undefined,
      conversationId: m.conversationId ?? undefined,
      parentMessageId: m.parentMessageId ?? undefined,
      pinned: m.pinned,
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
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}
