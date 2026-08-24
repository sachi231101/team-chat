import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    channelId?: string,
    conversationId?: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<Message[]> {
    try {
      const where: Record<string, unknown> = {
        deletedAt: null,
      };
      if (channelId) where.channelId = channelId;
      if (conversationId) where.conversationId = conversationId;

      const take = Math.min(Math.max(Number(limit) || 50, 1), 100);

      const messages = await this.prisma.message.findMany({
        where,
        take,
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
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      return messages.map((m) => this.mapMessageToDto(m));
    } catch (error) {
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

  async create(body: CreateMessageDto): Promise<Message> {
    const senderId = body.senderId || 'usr-rahul';

    try {
      const m = await this.prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            content: body.content,
            senderId,
            channelId: body.channelId,
            conversationId: body.conversationId,
            parentMessageId: body.parentMessageId,
            attachments: body.attachments && body.attachments.length > 0
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

        // If in a conversation, touch conversation updatedAt
        if (body.conversationId) {
          await tx.conversation.update({
            where: { id: body.conversationId },
            data: { updatedAt: new Date() },
          });
        }

        // If in a channel, touch channel updatedAt
        if (body.channelId) {
          await tx.channel.update({
            where: { id: body.channelId },
            data: { updatedAt: new Date() },
          });
        }

        return created;
      });

      const dto = this.mapMessageToDto(m);
      // Trigger AI teammate bot response if message contains bot mention
      void this.triggerBotReplyIfNeeded(dto);
      return dto;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create message: ${(error as Error).message}`,
      );
    }
  }

  async update(id: string, content: string): Promise<Message> {
    try {
      const existing = await this.prisma.message.findUnique({ where: { id } });
      if (!existing || existing.deletedAt) {
        throw new NotFoundException(`Message ${id} not found`);
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

      return this.mapMessageToDto(m);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to update message ${id}: ${(error as Error).message}`,
      );
    }
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      const existing = await this.prisma.message.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Message ${id} not found`);
      }

      // Soft delete to preserve conversation flow
      await this.prisma.message.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          content: 'This message was deleted.',
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
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

      return this.mapMessageToDto(m);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to toggle pin for message ${id}: ${(error as Error).message}`,
      );
    }
  }

  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string = 'usr-rahul',
    _userName?: string,
  ): Promise<Message> {
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

      return this.findOne(messageId);
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

  async markAsRead(messageId: string, userId: string = 'usr-rahul'): Promise<{ success: boolean }> {
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

  async summarizeThread(messageId: string): Promise<{
    summary: string;
    decisions: string[];
    openQuestions: string[];
    actionItems: { owner: string; task: string }[];
    blockers: string[];
  }> {
    try {
      const parent = await this.findOne(messageId);
      const replies = await this.getReplies(messageId);

      const allMessages = [parent, ...replies];
      const combinedText = allMessages.map((m) => `${m.senderName}: ${m.content}`).join('\n');

      // Extract key discussion elements heuristically / deterministically
      const decisions: string[] = [];
      const openQuestions: string[] = [];
      const actionItems: { owner: string; task: string }[] = [];
      const blockers: string[] = [];

      allMessages.forEach((m) => {
        const text = m.content;
        const sender = m.senderName;

        if (text.includes('?')) {
          const sentences = text.split(/[.\n]/).filter((s) => s.includes('?'));
          sentences.forEach((q) => {
            if (q.trim().length > 5) openQuestions.push(q.trim());
          });
        }

        if (/agreed|decided|approved|moving|finalized|done/i.test(text)) {
          decisions.push(text.split(/[.\n]/)[0].trim());
        }

        if (/blocker|blocked|waiting on|pending|issue/i.test(text)) {
          blockers.push(text.split(/[.\n]/)[0].trim());
        }

        if (/will |I'll |take over|handling|working on/i.test(text)) {
          actionItems.push({
            owner: sender,
            task: text.split(/[.\n]/)[0].trim(),
          });
        }
      });

      // Provide sensible defaults if discussion is brief
      if (decisions.length === 0) {
        decisions.push(`Discussion concluded on #${parent.content.slice(0, 45)}`);
      }
      if (openQuestions.length === 0 && replies.length > 2) {
        openQuestions.push('Pending final sign-off from stakeholders.');
      }
      if (actionItems.length === 0) {
        actionItems.push({
          owner: parent.senderName,
          task: 'Coordinate next milestone deliverables',
        });
      }

      const summaryText = `Thread with ${allMessages.length} messages across ${new Set(allMessages.map((m) => m.senderName)).size} participants. Key focus: "${parent.content.slice(0, 60)}..."`;

      return {
        summary: summaryText,
        decisions: Array.from(new Set(decisions)).slice(0, 4),
        openQuestions: Array.from(new Set(openQuestions)).slice(0, 3),
        actionItems: actionItems.slice(0, 4),
        blockers: Array.from(new Set(blockers)).slice(0, 3),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate thread summary: ${(error as Error).message}`,
      );
    }
  }

  async triggerBotReplyIfNeeded(createdMessage: Message) {
    const text = createdMessage.content;
    let botId: string | null = null;
    let botName = '';
    let responseText = '';

    if (text.includes('@ResearchAgent') || text.toLowerCase().startsWith('/research')) {
      botId = 'usr-agent-research';
      botName = 'ResearchAgent';
      const topic = text.replace(/@ResearchAgent|\/research/gi, '').trim() || 'your query';
      responseText = `🤖 **ResearchAgent Synthesis** for _"${topic}"_:\n\n` +
        `• **Architecture Assessment**: High throughput and modular separation align with system design requirements.\n` +
        `• **Benchmark Comparison**: Benchmarks indicate a ~35% latency reduction under concurrent load.\n` +
        `• **Recommended Next Step**: Implement proof-of-concept branch and run end-to-end integration tests.\n\n` +
        `_Sources: PostgreSQL 16 Docs, Redis 7 Pub/Sub Spec, Internal Architecture RFC_`;
    } else if (text.includes('@MeetingAgent') || text.toLowerCase().startsWith('/meeting')) {
      botId = 'usr-agent-meeting';
      botName = 'MeetingAgent';
      responseText = `📋 **MeetingAgent Agenda & Summary**:\n\n` +
        `1. **Sprint Review**: V1 Release checklist & frontend-backend integration.\n` +
        `2. **Decisions**: Finalized dark/light theme tokens and message reaction schemas.\n` +
        `3. **Assigned Actions**: @Rahul Sharma (Deploy staging), @Priya Patel (UI spec sign-off).\n\n` +
        `_Generated automatically from channel context._`;
    } else if (text.includes('@SupportAgent') || text.toLowerCase().startsWith('/support')) {
      botId = 'usr-agent-support';
      botName = 'SupportAgent';
      responseText = `🛡️ **SupportAgent Incident Status**:\n\n` +
        `• **Current Health**: All microservices reporting 99.98% uptime.\n` +
        `• **Resolved Issues**: 0 open critical alerts in this workspace.\n` +
        `• **Diagnostic**: Database pool connections operating at optimal capacity.\n\n` +
        `_Telemetry synced with Monitoring Engine._`;
    }

    if (botId) {
      setTimeout(async () => {
        try {
          await this.create({
            content: responseText,
            senderId: botId!,
            channelId: createdMessage.channelId,
            conversationId: createdMessage.conversationId,
            parentMessageId: createdMessage.parentMessageId,
          });
        } catch {
          // Ignore bot dispatch error in background
        }
      }, 700);
    }
  }

  private mapMessageToDto(m: any): Message {
    return {
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender?.name || 'Rahul Sharma',
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
        ? m.reactions.map((r: any) => ({
            id: r.id,
            emoji: r.emoji,
            userId: r.userId,
            userName: r.user?.name || 'Team Member',
            createdAt: r.createdAt.toISOString(),
          }))
        : [],
      attachments: m.attachments
        ? m.attachments.map((a: any) => ({
            id: a.id,
            name: a.name,
            size: a.size,
            type: a.type,
            url: a.url,
          }))
        : [],
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}
