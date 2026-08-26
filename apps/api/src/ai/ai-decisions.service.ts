import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NvidiaLlmService } from './nvidia-llm.service';
import { AiContextService } from './ai-context.service';
import type { RequestUser } from '../common/request-user';
import type { DecisionRecord, DecisionStatus } from '@team-chat/shared';

@Injectable()
export class AiDecisionsService {
  private readonly logger = new Logger(AiDecisionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: NvidiaLlmService,
    private readonly context: AiContextService,
  ) {}

  async getDecisions(
    workplaceId: string,
    filters?: {
      channelId?: string;
      status?: string;
      search?: string;
    },
  ): Promise<DecisionRecord[]> {
    try {
      const where: any = { workplaceId };
      if (filters?.channelId) where.channelId = filters.channelId;
      if (filters?.status) where.status = filters.status;

      const raw = await (this.prisma as any).decisionRecord.findMany({
        where,
        include: {
          decidedBy: { select: { id: true, name: true } },
          channel: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return raw.map((d: any) => ({
        id: d.id,
        title: d.title,
        rationale: d.rationale,
        status: d.status as DecisionStatus,
        decidedById: d.decidedById,
        decidedByName: d.decidedBy?.name,
        channelId: d.channelId,
        channelName: d.channel?.name,
        messageId: d.messageId,
        impactedAreas: d.impactedAreas || [],
        workplaceId: d.workplaceId,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }));
    } catch (err) {
      this.logger.warn(`Failed to fetch decision records: ${(err as Error).message}`);
      return [];
    }
  }

  async createDecision(
    user: RequestUser,
    data: {
      title: string;
      rationale?: string;
      channelId?: string;
      messageId?: string;
      status?: DecisionStatus;
      impactedAreas?: string[];
    },
  ) {
    const created = await (this.prisma as any).decisionRecord.create({
      data: {
        title: data.title.trim(),
        rationale: data.rationale?.trim() || null,
        status: data.status || 'APPROVED',
        decidedById: user.id,
        channelId: data.channelId || null,
        messageId: data.messageId || null,
        impactedAreas: data.impactedAreas || [],
        workplaceId: user.workplaceId,
      },
      include: {
        decidedBy: { select: { id: true, name: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    return created;
  }

  async updateDecision(
    id: string,
    data: {
      title?: string;
      rationale?: string;
      status?: DecisionStatus;
      impactedAreas?: string[];
    },
  ) {
    return (this.prisma as any).decisionRecord.update({
      where: { id },
      data,
    });
  }

  async deleteDecision(id: string) {
    await (this.prisma as any).decisionRecord.delete({ where: { id } });
    return { success: true };
  }

  async detectDecisions(
    user: RequestUser,
    body: {
      channelId?: string;
      conversationId?: string;
      parentMessageId?: string;
      transcript?: string;
    },
  ) {
    const source =
      body.transcript ||
      (await this.context.buildTranscript({
        userId: user.id,
        channelId: body.channelId,
        conversationId: body.conversationId,
        parentMessageId: body.parentMessageId,
        take: 40,
      }));

    if (!source.trim()) return { decisions: [] };

    const prompt = `Analyze this conversation transcript and detect any agreed-upon team decisions, architectural choices, or resolved conclusions.
Output ONLY JSON:
{
  "decisions": [
    {
      "title": "Decided to adopt Prisma with PostgreSQL",
      "rationale": "Better type safety and automated migration workflow",
      "decidedBy": "Rahul Sharma",
      "impactedAreas": ["Backend", "Database"],
      "confidence": 0.94
    }
  ]
}

Transcript:
${source}`;

    try {
      const raw = await this.llm.complete([
        {
          role: 'system',
          content: 'You identify agreed architectural and product decisions in conversations. Return raw JSON.',
        },
        { role: 'user', content: prompt },
      ]);

      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { decisions: parsed.decisions || [] };
      }
    } catch (err) {
      this.logger.warn(`Detect decisions failed: ${(err as Error).message}`);
    }

    return { decisions: [] };
  }
}
