import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LlmService } from './llm/llm.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SearchService } from '../search/search.service';
import type { RequestUser } from '../common/request-user';
import type { AiTeammateInfo, AiTaskProgressUpdate } from '@team-chat/shared';
import { AGENT_PERSONAS, AGENT_USER_IDS, isAgentUserId } from './ai.constants';

@Injectable()
export class AiTeammatesService {
  private readonly logger = new Logger(AiTeammatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly realtime: RealtimeService,
    private readonly search: SearchService,
  ) {}

  async getTeammates(workplaceId: string): Promise<AiTeammateInfo[]> {
    const agents = await this.prisma.user.findMany({
      where: { id: { startsWith: 'usr-agent-' }, workplaceId },
    });

    const teammates: AiTeammateInfo[] = [];

    for (const agent of agents) {
      const activeTaskCount = await this.prisma.actionItem.count({
        where: { assigneeId: agent.id, status: { in: ['TODO', 'IN_PROGRESS'] } },
      });

      const skillsMap: Record<string, string[]> = {
        'usr-agent-research': ['Workspace Search', 'Citation Verification', 'Deep Technical Q&A', 'Paper & Doc Review'],
        'usr-agent-meeting': ['Meeting Minutes', 'Decision Extraction', 'Action Checklists', 'Agenda Synthesis'],
        'usr-agent-support': ['Incident Triage', 'Log Diagnostics', 'Root Cause Analysis', 'Infrastructure Alerts'],
        'usr-agent-workspace': ['Catch-up Briefings', 'Drafting Assistant', 'Smart Scheduling', 'Workflow Routing'],
        'usr-agent-task': ['Action Item Extraction', 'Owner & Deadline Proposal', 'Task Assignment', 'Progress Tracking'],
      };

      teammates.push({
        id: agent.id,
        name: agent.name,
        title: agent.title || 'AI Teammate',
        roleDescription: agent.statusMessage || AGENT_PERSONAS[agent.id as any]?.system || 'Autonomous AI Worker',
        avatarUrl: agent.avatarUrl || undefined,
        status: agent.status as any,
        activeTaskCount,
        skills: skillsMap[agent.id] || ['General Assistant'],
      });
    }

    return teammates;
  }

  async executeAssignedTask(
    user: RequestUser,
    actionItemId: string,
  ): Promise<AiTaskProgressUpdate> {
    const action = await this.prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: { channel: true, message: true },
    });

    if (!action || !action.assigneeId || !isAgentUserId(action.assigneeId)) {
      throw new Error('Action item is not assigned to an AI teammate');
    }

    const agentId = action.assigneeId;
    const persona = AGENT_PERSONAS[agentId];

    // 1. Mark IN_PROGRESS
    await this.prisma.actionItem.update({
      where: { id: actionItemId },
      data: { status: 'IN_PROGRESS' },
    });

    // 2. Perform task using LLM & search if ResearchAgent
    let contextData = '';
    if (agentId === 'usr-agent-research') {
      const hits = await this.search.search(action.title, user.id, user.workplaceId);
      contextData = hits.messages
        .slice(0, 5)
        .map((m) => `[${m.senderName}]: ${m.content}`)
        .join('\n');
    }

    const prompt = `You are ${persona.name} (${persona.system}).
You have been assigned this Action Item in Team Chat:
Title: ${action.title}
Description: ${action.description || 'None provided'}
Channel: #${action.channel?.name || 'general'}
${contextData ? `Retrieved Workspace Evidence:\n${contextData}\n` : ''}

Execute this task and produce a concrete, high-quality deliverable report.`;

    const deliverable = await this.llm.complete([
      { role: 'system', content: persona.system },
      { role: 'user', content: prompt },
    ]);

    // 3. Complete task (mark DONE and update description with deliverable)
    const updatedDescription = `${action.description ? `${action.description}\n\n` : ''}### ✅ AI Deliverable by ${persona.name}:\n${deliverable}`;

    await this.prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        status: 'DONE',
        description: updatedDescription,
      },
    });

    return {
      actionItemId,
      agentId,
      status: 'DONE',
      progressMessage: `${persona.name} completed the assigned task: "${action.title}".`,
      deliverable,
    };
  }

  async checkProgress(
    user: RequestUser,
    actionItemId: string,
  ): Promise<AiTaskProgressUpdate> {
    const action = await this.prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: { assignee: true },
    });

    if (!action) throw new Error('Action item not found');

    const agentId = action.assigneeId || 'usr-agent-workspace';
    const persona = AGENT_PERSONAS[agentId as any] || { name: 'AI Teammate' };

    return {
      actionItemId,
      agentId,
      status: action.status as any,
      progressMessage:
        action.status === 'DONE'
          ? `${persona.name} has finished this task.`
          : `${persona.name} is currently working on this task (${action.status}).`,
      deliverable: action.description || undefined,
    };
  }
}
