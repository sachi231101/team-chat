import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NvidiaLlmService } from './nvidia-llm.service';
import { AiLearningService } from './ai-learning.service';
import type { RequestUser } from '../common/request-user';
import type { SmartRouteSuggestion } from '@team-chat/shared';

@Injectable()
export class AiSmartRoutingService {
  private readonly logger = new Logger(AiSmartRoutingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: NvidiaLlmService,
    private readonly learning: AiLearningService,
  ) {}

  async analyzeAndRoute(
    user: RequestUser,
    body: {
      text: string;
      currentChannelId?: string;
    },
  ): Promise<SmartRouteSuggestion> {
    const text = body.text.trim();
    if (!text || text.length < 5) {
      return {
        confidence: 0,
        reason: 'Text is too short to determine routing suggestions.',
      };
    }

    const [channels, users] = await Promise.all([
      this.prisma.channel.findMany({
        where: { workplaceId: user.workplaceId },
        select: { id: true, name: true, description: true, topic: true },
      }),
      this.prisma.user.findMany({
        where: { workplaceId: user.workplaceId },
        select: { id: true, name: true, title: true },
      }),
    ]);

    const channelsInfo = channels
      .map((c) => `- #${c.name} (id: ${c.id}): ${c.description || ''} ${c.topic || ''}`)
      .join('\n');

    const usersInfo = users
      .map((u) => `- @${u.name} (id: ${u.id}, role: ${u.title || 'Teammate'})`)
      .join('\n');

    const learnedRules = await this.learning.getActiveRulesPrompt(user.workplaceId);

    const prompt = `You are an AI Smart Message Router.
Analyze the following draft message and suggest the best destination channel, people to tag, specialized AI agent to mention, or whether to create an action item.

Available Channels:
${channelsInfo}

Available Team Members & AI Teammates:
${usersInfo}
- @ResearchAgent (id: usr-agent-research): For deep workspace search, citations, and decision memory
- @MeetingAgent (id: usr-agent-meeting): For meeting minutes, agendas, action item summaries
- @SupportAgent (id: usr-agent-support): For incidents, bugs, production alerts, infrastructure
- @WorkspaceAgent (id: usr-agent-workspace): Personal workspace assistant
- @TaskCoordinator (id: usr-agent-task): For turning discussions into assigned tasks and tracking deadlines

Draft Message to Route:
"${text}"
${learnedRules}

Output ONLY valid JSON in this format (no code fences, no extra text):
{
  "suggestedChannelName": "engineering",
  "suggestedUserName": "Arjun Mehta",
  "suggestedAgentName": "SupportAgent",
  "shouldCreateTask": true,
  "suggestedTaskTitle": "Fix Redis query timeout",
  "confidence": 0.92,
  "reason": "This is a backend performance issue requiring DevOps and SupportAgent triage."
}`;

    try {
      const raw = await this.llm.complete([
        {
          role: 'system',
          content: 'You route messages to the right channels, teammates, and agents. Output ONLY raw JSON.',
        },
        { role: 'user', content: prompt },
      ]);

      const jsonStr = this.extractJsonBlock(raw);
      const parsed = JSON.parse(jsonStr);

      const matchedChannel = channels.find(
        (c) => c.name.toLowerCase() === parsed.suggestedChannelName?.replace(/^#/, '').toLowerCase(),
      );

      const matchedUser = users.find(
        (u) => u.name.toLowerCase().includes(parsed.suggestedUserName?.replace(/^@/, '').toLowerCase()),
      );

      let agentId: string | undefined;
      const agentNameLower = parsed.suggestedAgentName?.toLowerCase() || '';
      if (agentNameLower.includes('research')) agentId = 'usr-agent-research';
      else if (agentNameLower.includes('meeting') || agentNameLower.includes('notes')) agentId = 'usr-agent-meeting';
      else if (agentNameLower.includes('support')) agentId = 'usr-agent-support';
      else if (agentNameLower.includes('workspace')) agentId = 'usr-agent-workspace';
      else if (agentNameLower.includes('task') || agentNameLower.includes('coord')) agentId = 'usr-agent-task';

      return {
        suggestedChannelId: matchedChannel?.id,
        suggestedChannelName: matchedChannel ? `#${matchedChannel.name}` : undefined,
        suggestedUserId: matchedUser?.id,
        suggestedUserName: matchedUser ? `@${matchedUser.name}` : undefined,
        suggestedAgentId: agentId,
        suggestedAgentName: agentId ? `@${parsed.suggestedAgentName?.replace(/^@/, '')}` : undefined,
        shouldCreateTask: Boolean(parsed.shouldCreateTask),
        suggestedTaskTitle: parsed.suggestedTaskTitle,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        reason: parsed.reason || 'AI Smart Route suggestion based on message semantics.',
      };
    } catch (err) {
      this.logger.warn(`Smart route failed: ${(err as Error).message}`);
      return {
        confidence: 0,
        reason: 'Unable to compute smart routing.',
      };
    }
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
