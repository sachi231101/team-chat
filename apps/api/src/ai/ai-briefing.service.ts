import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LlmService } from './llm/llm.service';
import { AiLearningService } from './ai-learning.service';
import type { RequestUser } from '../common/request-user';
import type { DailyBriefingData, BriefingTask, BriefingDecision, BriefingRisk, BriefingApproval } from '@team-chat/shared';

@Injectable()
export class AiBriefingService {
  private readonly logger = new Logger(AiBriefingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly learning: AiLearningService,
  ) {}

  async getDailyBriefing(
    user: RequestUser,
    timeframe: 'today' | '24h' | '7d' = '24h',
  ): Promise<DailyBriefingData> {
    const userProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, workplaceId: true },
    });

    const userName = userProfile?.name || 'Teammate';
    const now = new Date();

    // 1. Fetch User's Action Items
    const rawTasks = await this.prisma.actionItem.findMany({
      where: {
        workplaceId: user.workplaceId,
        OR: [{ assigneeId: user.id }, { creatorId: user.id }],
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: { channel: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 15,
    });

    const myTasks: BriefingTask[] = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status as any,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      channelName: t.channel?.name || 'Direct',
      isOverdue: t.dueDate ? new Date(t.dueDate) < now : false,
    }));

    // 2. Fetch User's Channel Memberships
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId: user.id },
      select: { channelId: true, channel: { select: { id: true, name: true } } },
    });
    const channelIds = memberships.map((m) => m.channelId);

    const msMap = { today: 12 * 3600 * 1000, '24h': 24 * 3600 * 1000, '7d': 7 * 24 * 3600 * 1000 };
    const since = new Date(Date.now() - msMap[timeframe]);

    // 3. Fetch Recent Decisions
    let keyDecisions: BriefingDecision[] = [];
    try {
      const rawDecisions = await (this.prisma as any).decisionRecord.findMany({
        where: {
          workplaceId: user.workplaceId,
          channelId: { in: channelIds },
          createdAt: { gte: since },
        },
        include: { channel: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      keyDecisions = rawDecisions.map((d: any) => ({
        id: d.id,
        title: d.title,
        rationale: d.rationale,
        channelName: d.channel?.name || 'Workspace',
        createdAt: d.createdAt.toISOString(),
      }));
    } catch {
      keyDecisions = [];
    }

    // 4. Fetch Recent Messages across user channels for AI digest & risks detection
    const recentMessages = await this.prisma.message.findMany({
      where: {
        channelId: { in: channelIds },
        createdAt: { gte: since },
        deletedAt: null,
      },
      include: { sender: { select: { name: true } }, channel: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    const formattedTranscript = recentMessages
      .map((m, i) => `[#${m.channel?.name || 'general'}] ${m.sender.name}: ${m.content}`)
      .join('\n');

    let summary = 'Everything is on track. No critical blockers detected.';
    let blockersAndRisks: BriefingRisk[] = [];
    let pendingApprovals: BriefingApproval[] = [];
    const channelHighlights: { channelId: string; channelName: string; highlight: string }[] = [];

    if (this.llm.isEnabled() && recentMessages.length > 0) {
      try {
        const learnedRules = await this.learning.getActiveRulesPrompt(user.workplaceId);
        const prompt = `You are an executive Chief of Staff generating a personalized daily briefing for ${userName}.
Timeframe: ${timeframe}

Transcript from channels ${userName} participates in:
${formattedTranscript}

Active Tasks for ${userName}:
${myTasks.map((t) => `- ${t.title} (Due: ${t.dueDate || 'None'}, Overdue: ${t.isOverdue})`).join('\n') || '(None)'}

Generate a concise JSON briefing strictly following this format (no code fences, valid JSON only):
{
  "summary": "2-3 clear sentences summarizing key developments, priorities, and what needs attention today.",
  "blockersAndRisks": [
    { "id": "risk-1", "title": "Specific blocker or risk description", "severity": "HIGH"|"MEDIUM"|"LOW", "channelName": "engineering" }
  ],
  "pendingApprovals": [
    { "id": "app-1", "item": "PR review or design sign-off", "requester": "Priya Patel", "status": "PENDING" }
  ],
  "channelHighlights": [
    { "channelName": "engineering", "highlight": "1 sentence key update" }
  ]
}
${learnedRules}`;

        const raw = await this.llm.complete([
          {
            role: 'system',
            content: 'You generate high-signal personal daily briefings. Return ONLY valid JSON.',
          },
          { role: 'user', content: prompt },
        ]);

        const jsonStr = this.extractJsonBlock(raw);
        const parsed = JSON.parse(jsonStr);

        summary = parsed.summary || summary;
        blockersAndRisks = parsed.blockersAndRisks || [];
        pendingApprovals = parsed.pendingApprovals || [];

        if (parsed.channelHighlights && Array.isArray(parsed.channelHighlights)) {
          for (const ch of parsed.channelHighlights) {
            const matchedMember = memberships.find((m) => m.channel.name.toLowerCase() === ch.channelName?.toLowerCase());
            channelHighlights.push({
              channelId: matchedMember?.channelId || ch.channelName,
              channelName: ch.channelName,
              highlight: ch.highlight,
            });
          }
        }
      } catch (err) {
        this.logger.warn(`AI briefing synthesis failed: ${(err as Error).message}`);
        summary = `Here is your ${timeframe} summary: ${myTasks.length} active tasks, ${keyDecisions.length} recorded decisions across ${memberships.length} channels.`;
      }
    } else {
      summary = `Welcome back, ${userName}! You have ${myTasks.length} tasks in progress and ${keyDecisions.length} recent team decisions.`;
    }

    return {
      userId: user.id,
      userName,
      generatedAt: now.toISOString(),
      timeframe,
      summary,
      myTasks,
      keyDecisions,
      blockersAndRisks,
      pendingApprovals,
      channelHighlights,
    };
  }

  private extractJsonBlock(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) return match[1].trim();
    const firstOpen = trimmed.indexOf('{');
    const lastClose = trimmed.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
      return trimmed.slice(firstOpen, lastClose + 1);
    }
    return trimmed;
  }
}
