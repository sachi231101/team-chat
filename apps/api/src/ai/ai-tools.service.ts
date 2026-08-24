import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SearchService } from '../search/search.service';
import { AiAssistantService } from './ai-assistant.service';
import type { SummarizeWindow } from './ai.constants';

export type WorkspaceToolCall =
  | { tool: 'search_messages'; query: string }
  | { tool: 'summarize_channel'; channelName: string; window?: SummarizeWindow }
  | { tool: 'list_unread' }
  | { tool: 'draft_reply'; text: string };

@Injectable()
export class AiToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    @Inject(forwardRef(() => AiAssistantService))
    private readonly assistant: AiAssistantService,
  ) {}

  parseToolCall(raw: string): WorkspaceToolCall | { reply: string } | null {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { reply: trimmed };
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      if (typeof parsed.reply === 'string' && !parsed.tool) {
        return { reply: parsed.reply };
      }
      const tool = parsed.tool;
      if (tool === 'search_messages' && typeof parsed.query === 'string') {
        return { tool: 'search_messages', query: parsed.query };
      }
      if (tool === 'summarize_channel' && typeof parsed.channelName === 'string') {
        const window =
          parsed.window === 'unread' || parsed.window === '24h' || parsed.window === '7d'
            ? parsed.window
            : '24h';
        return { tool: 'summarize_channel', channelName: parsed.channelName, window };
      }
      if (tool === 'list_unread') {
        return { tool: 'list_unread' };
      }
      if (tool === 'draft_reply' && typeof parsed.text === 'string') {
        return { tool: 'draft_reply', text: parsed.text };
      }
      return { reply: trimmed };
    } catch {
      return { reply: trimmed };
    }
  }

  async execute(
    userId: string,
    workplaceId: string,
    call: WorkspaceToolCall,
  ): Promise<string> {
    if (call.tool === 'search_messages') {
      const hits = await this.search.search(call.query, userId, workplaceId);
      if (hits.messages.length === 0) return 'No matching messages.';
      return hits.messages
        .slice(0, 12)
        .map((m, i) => `[${i + 1}] ${m.senderName}: ${m.content.slice(0, 220)}`)
        .join('\n');
    }

    if (call.tool === 'summarize_channel') {
      const channel = await this.prisma.channel.findFirst({
        where: {
          workplaceId,
          name: { equals: call.channelName.replace(/^#/, ''), mode: 'insensitive' },
        },
      });
      if (!channel) return `Channel #${call.channelName} was not found.`;
      const result = await this.assistant.summarize(
        { id: userId, workplaceId },
        { window: call.window ?? '24h', channelId: channel.id },
      );
      return result.summary;
    }

    if (call.tool === 'list_unread') {
      return this.listUnread(userId, workplaceId);
    }

    return `Draft (not sent — user must copy or confirm):\n${call.text}`;
  }

  async listUnread(userId: string, workplaceId: string): Promise<string> {
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId, channel: { workplaceId } },
      include: { channel: true },
    });

    const lines: string[] = [];
    for (const m of memberships) {
      const lastRead = await this.prisma.readReceipt.findFirst({
        where: { userId, message: { channelId: m.channelId } },
        orderBy: { readAt: 'desc' },
        include: { message: { select: { createdAt: true } } },
      });
      const since = lastRead?.message?.createdAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await this.prisma.message.count({
        where: {
          channelId: m.channelId,
          deletedAt: null,
          parentMessageId: null,
          createdAt: { gt: since },
          senderId: { not: userId },
        },
      });
      if (count > 0) {
        lines.push(`#${m.channel.name}: ${count} new message(s)`);
      }
    }

    return lines.length > 0 ? lines.join('\n') : 'No unread channel activity detected.';
  }
}
