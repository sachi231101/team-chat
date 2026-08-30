import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LlmService } from './llm/llm.service';
import type { RequestUser } from '../common/request-user';

@Injectable()
export class AiLearningService {
  private readonly logger = new Logger(AiLearningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async recordCorrection(
    user: RequestUser,
    data: {
      agentId?: string;
      category?: string;
      originalText: string;
      correctedText: string;
      instruction?: string;
    },
  ) {
    const category = data.category || 'general';

    // 1. Save raw human correction record
    const correction = await this.prisma.aiCorrection.create({
      data: {
        workplaceId: user.workplaceId,
        userId: user.id,
        agentId: data.agentId,
        category,
        originalText: data.originalText,
        correctedText: data.correctedText,
        instruction: data.instruction,
      },
    });

    // 2. Synthesize a generalized team instruction rule using LLM
    try {
      if (this.llm.isEnabled()) {
        const generalizedRule = await this.llm.complete([
          {
            role: 'system',
            content:
              'You extract concise team preferences and guidelines from human edits to AI outputs. Output ONLY a 1-sentence actionable rule for future AI responses.',
          },
          {
            role: 'user',
            content: `Original AI output:\n${data.originalText}\n\nHuman corrected version:\n${
              data.correctedText
            }\n\nOptional note: ${data.instruction || 'None'}\n\nExtract the core guideline rule:`,
          },
        ]);

        if (generalizedRule && generalizedRule.trim().length > 5) {
          await this.prisma.aiLearningRule.create({
            data: {
              workplaceId: user.workplaceId,
              rule: generalizedRule.trim().replace(/^["']|["']$/g, ''),
              category,
              sourceCorrectionId: correction.id,
              active: true,
              confidence: 0.9,
            },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to synthesize learning rule: ${(err as Error).message}`);
    }

    return { success: true, correctionId: correction.id };
  }

  async getRules(workplaceId: string) {
    return this.prisma.aiLearningRule.findMany({
      where: { workplaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(workplaceId: string, rule: string, category = 'general') {
    return this.prisma.aiLearningRule.create({
      data: {
        workplaceId,
        rule: rule.trim(),
        category,
        active: true,
        confidence: 1.0,
      },
    });
  }

  async toggleRule(user: RequestUser, id: string, active: boolean) {
    const existing = await this.prisma.aiLearningRule.findFirst({
      where: { id, workplaceId: user.workplaceId },
    });
    if (!existing) throw new NotFoundException('Rule not found');
    return this.prisma.aiLearningRule.update({
      where: { id },
      data: { active },
    });
  }

  async deleteRule(user: RequestUser, id: string) {
    const existing = await this.prisma.aiLearningRule.findFirst({
      where: { id, workplaceId: user.workplaceId },
    });
    if (!existing) throw new NotFoundException('Rule not found');
    await this.prisma.aiLearningRule.delete({ where: { id } });
    return { success: true };
  }

  async getActiveRulesPrompt(workplaceId: string): Promise<string> {
    try {
      const rules = await this.prisma.aiLearningRule.findMany({
        where: { workplaceId, active: true },
        take: 8,
        orderBy: { updatedAt: 'desc' },
      });

      if (rules.length === 0) return '';

      const lines = rules.map((r, i) => `${i + 1}. [${r.category.toUpperCase()}] ${r.rule}`).join('\n');
      return `\n\n### Team Guidelines & Learned Rules (strictly follow these preferences):\n${lines}\n`;
    } catch {
      return '';
    }
  }
}
