import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NvidiaLlmService } from './nvidia-llm.service';
import { AiContextService } from './ai-context.service';
import { AiLearningService } from './ai-learning.service';
import type { RequestUser } from '../common/request-user';
import type { WorkExtractionResult } from '@team-chat/shared';

@Injectable()
export class AiWorkExtractionService {
  private readonly logger = new Logger(AiWorkExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: NvidiaLlmService,
    private readonly context: AiContextService,
    private readonly learning: AiLearningService,
  ) {}

  async extractWork(
    user: RequestUser,
    body: {
      channelId?: string;
      conversationId?: string;
      parentMessageId?: string;
      messageId?: string;
      transcript?: string;
      text?: string;
    },
  ): Promise<WorkExtractionResult> {
    let sourceContent = body.transcript || body.text || '';

    if (!sourceContent) {
      if (body.messageId) {
        const msg = await this.prisma.message.findUnique({
          where: { id: body.messageId },
          include: { sender: true },
        });
        if (msg) {
          sourceContent = `${msg.sender.name}: ${msg.content}`;
        }
      } else if (body.channelId || body.conversationId || body.parentMessageId) {
        sourceContent = await this.context.buildTranscript({
          userId: user.id,
          channelId: body.channelId,
          conversationId: body.conversationId,
          parentMessageId: body.parentMessageId,
          take: 50,
        });
      }
    }

    if (!sourceContent.trim()) {
      return {
        tasks: [],
        decisions: [],
        risks: [],
        approvals: [],
        summary: 'No conversation content provided to analyze.',
      };
    }

    const learnedRules = await this.learning.getActiveRulesPrompt(user.workplaceId);

    const prompt = `You are an AI enterprise workflow analyzer.
Extract structured work items from the following conversation transcript.

Allowed JSON structure ONLY (no markdown formatting, no code fences):
{
  "summary": "Short 1-2 sentence executive overview",
  "tasks": [
    {
      "title": "Clear action-oriented task title",
      "description": "Brief context and deliverables",
      "assigneeName": "Specific person name or AI agent if mentioned, else null",
      "dueDate": "ISO 8601 date (YYYY-MM-DD) if specified or inferred, else null",
      "status": "TODO",
      "confidence": 0.95
    }
  ],
  "decisions": [
    {
      "title": "Agreed decision or architecture conclusion",
      "rationale": "Why this was decided",
      "decidedBy": "Name of person or team who decided",
      "impactedAreas": ["Frontend", "Database", etc],
      "confidence": 0.9
    }
  ],
  "risks": [
    {
      "title": "Identified risk or blocker",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "mitigation": "Recommended action or next step",
      "owner": "Name of responsible owner if any"
    }
  ],
  "approvals": [
    {
      "item": "What requires approval",
      "requester": "Name of requester",
      "approver": "Name of target approver",
      "status": "PENDING"
    }
  ]
}
${learnedRules}
Transcript to analyze:
${sourceContent}`;

    try {
      const raw = await this.llm.complete([
        {
          role: 'system',
          content: 'You extract structured tasks, decisions, risks, and approvals. Output ONLY raw valid JSON.',
        },
        { role: 'user', content: prompt },
      ]);

      const jsonStr = this.extractJsonBlock(raw);
      const parsed = JSON.parse(jsonStr) as WorkExtractionResult;

      // Match assignee names to real user IDs
      const workspaceUsers = await this.prisma.user.findMany({
        where: { workplaceId: user.workplaceId },
        select: { id: true, name: true },
      });

      const userMap = new Map(workspaceUsers.map((u) => [u.name.toLowerCase(), u.id]));

      const enrichedTasks = (parsed.tasks || []).map((t) => {
        let assigneeId = t.assigneeId;
        if (!assigneeId && t.assigneeName) {
          const match = userMap.get(t.assigneeName.toLowerCase());
          if (match) assigneeId = match;
          else {
            for (const u of workspaceUsers) {
              if (u.name.toLowerCase().includes(t.assigneeName.toLowerCase())) {
                assigneeId = u.id;
                break;
              }
            }
          }
        }
        return {
          ...t,
          assigneeId,
          status: t.status || 'TODO',
        };
      });

      return {
        summary: parsed.summary || 'Work extraction completed.',
        tasks: enrichedTasks,
        decisions: parsed.decisions || [],
        risks: parsed.risks || [],
        approvals: parsed.approvals || [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Work extraction failed: ${message}`);
      return {
        tasks: [],
        decisions: [],
        risks: [],
        approvals: [],
        summary: 'Could not analyze this conversation.',
        error: message,
      };
    }
  }

  async applyWorkItems(
    user: RequestUser,
    body: {
      channelId?: string;
      conversationId?: string;
      messageId?: string;
      tasks?: Array<{
        title: string;
        description?: string;
        assigneeId?: string;
        dueDate?: string;
        status?: string;
      }>;
      decisions?: Array<{
        title: string;
        rationale?: string;
        impactedAreas?: string[];
      }>;
    },
  ) {
    const createdTasks: any[] = [];
    if (body.tasks && body.tasks.length > 0) {
      for (const t of body.tasks) {
        const created = await this.prisma.actionItem.create({
          data: {
            title: t.title,
            description: t.description,
            assigneeId: t.assigneeId || null,
            creatorId: user.id,
            channelId: body.channelId || null,
            conversationId: body.conversationId || null,
            messageId: body.messageId || null,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            status: 'TODO',
            workplaceId: user.workplaceId,
          },
        });
        createdTasks.push(created);
      }
    }

    const createdDecisions: any[] = [];
    if (body.decisions && body.decisions.length > 0) {
      for (const d of body.decisions) {
        const created = await (this.prisma as any).decisionRecord.create({
          data: {
            title: d.title,
            rationale: d.rationale || null,
            status: 'APPROVED',
            decidedById: user.id,
            channelId: body.channelId || null,
            messageId: body.messageId || null,
            impactedAreas: d.impactedAreas || [],
            workplaceId: user.workplaceId,
          },
        });
        createdDecisions.push(created);
      }
    }

    return {
      success: true,
      createdTaskCount: createdTasks.length,
      createdDecisionCount: createdDecisions.length,
      tasks: createdTasks,
      decisions: createdDecisions,
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
