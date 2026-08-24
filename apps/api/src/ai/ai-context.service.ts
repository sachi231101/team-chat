import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { ChatAccessService } from '../common/chat-access.service';
import type { SummarizeWindow } from './ai.constants';

export interface ContextLine {
  messageId: string;
  senderName: string;
  content: string;
  createdAt: string;
  channelId?: string;
  conversationId?: string;
}

@Injectable()
export class AiContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    private readonly config: ConfigService,
  ) {}

  async assertAccess(options: {
    userId: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
  }): Promise<void> {
    if (options.channelId) {
      await this.chatAccess.assertChannelAccess(options.userId, options.channelId);
    } else if (options.conversationId) {
      await this.chatAccess.assertConversationAccess(options.userId, options.conversationId);
    }
    if (options.parentMessageId) {
      await this.chatAccess.assertMessageAccess(options.userId, options.parentMessageId);
    }
  }

  async buildTranscript(options: {
    userId: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    window?: SummarizeWindow;
    take?: number;
  }): Promise<string> {
    const collected = await this.collectMessages(options);
    return this.format(collected);
  }

  async collectMessages(options: {
    userId: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    window?: SummarizeWindow;
    take?: number;
  }): Promise<ContextLine[]> {
    const take = options.take ?? this.maxMessages();
    await this.assertAccess(options);

    if (options.parentMessageId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: options.parentMessageId },
        include: { sender: true },
      });
      const replies = await this.prisma.message.findMany({
        where: { parentMessageId: options.parentMessageId, deletedAt: null },
        include: { sender: true },
        orderBy: { createdAt: 'asc' },
        take,
      });
      const lines: ContextLine[] = [];
      if (parent && !parent.deletedAt) {
        lines.push(this.toLine(parent));
      }
      for (const r of replies) {
        lines.push(this.toLine(r));
      }
      return this.filterByWindow(lines, options.window);
    }

    const since = await this.windowStart(options.userId, options.window, {
      channelId: options.channelId,
      conversationId: options.conversationId,
    });

    const where: Prisma.MessageWhereInput = {
      deletedAt: null,
      parentMessageId: null,
      ...(options.channelId ? { channelId: options.channelId } : {}),
      ...(options.conversationId ? { conversationId: options.conversationId } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
    };

    const rows = await this.prisma.message.findMany({
      where,
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return [...rows].reverse().map((m) => this.toLine(m));
  }

  format(lines: ContextLine[]): string {
    if (lines.length === 0) return '(No prior messages in this conversation.)';
    return lines
      .map((l, i) => `[${i + 1}] [${l.createdAt}] ${l.senderName}: ${l.content}`)
      .join('\n');
  }

  citationsFrom(lines: ContextLine[]) {
    return lines.slice(0, 15).map((m, i) => ({
      index: i + 1,
      messageId: m.messageId,
      senderName: m.senderName,
      content: m.content.slice(0, 240),
      channelId: m.channelId,
      conversationId: m.conversationId,
      createdAt: m.createdAt,
    }));
  }

  private toLine(m: {
    id: string;
    content: string;
    createdAt: Date;
    channelId: string | null;
    conversationId: string | null;
    sender?: { name: string } | null;
  }): ContextLine {
    return {
      messageId: m.id,
      senderName: m.sender?.name || 'Unknown',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      channelId: m.channelId ?? undefined,
      conversationId: m.conversationId ?? undefined,
    };
  }

  private filterByWindow(lines: ContextLine[], window?: SummarizeWindow): ContextLine[] {
    if (!window || window === 'unread') return lines;
    const ms = window === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const since = Date.now() - ms;
    return lines.filter((l) => new Date(l.createdAt).getTime() >= since);
  }

  private async windowStart(
    userId: string,
    window: SummarizeWindow | undefined,
    target: { channelId?: string; conversationId?: string },
  ): Promise<Date | undefined> {
    if (!window) return undefined;
    if (window === '24h') return new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (window === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const lastRead = await this.prisma.readReceipt.findFirst({
      where: {
        userId,
        message: target.channelId
          ? { channelId: target.channelId }
          : { conversationId: target.conversationId },
      },
      orderBy: { readAt: 'desc' },
      include: { message: { select: { createdAt: true } } },
    });
    if (lastRead?.message?.createdAt) return lastRead.message.createdAt;
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  private maxMessages(): number {
    const raw = Number(this.config.get<string>('AI_MAX_CONTEXT_MESSAGES'));
    if (Number.isFinite(raw) && raw > 0) return Math.min(raw, 80);
    return 40;
  }
}
