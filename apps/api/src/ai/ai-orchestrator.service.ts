import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from '@team-chat/shared';
import { PrismaService } from '../common/prisma.service';
import { MentionsService } from '../chat/mentions/mentions.service';
import { MessagesService } from '../chat/messages/messages.service';
import { ConversationsService } from '../chat/conversations/conversations.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AiContextService } from './ai-context.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiToolsService } from './ai-tools.service';
import { LlmService } from './llm/llm.service';
import {
  AGENT_PERSONAS,
  AgentUserId,
  isAgentUserId,
  isWorkspaceAgent,
} from './ai.constants';

const WORKSPACE_TOOL_PROMPT = `You are WorkspaceAgent in a private DM.
Allowed tools — return ONLY JSON, no markdown:
{"tool":"search_messages","query":"..."}
{"tool":"summarize_channel","channelName":"engineering","window":"24h"}
{"tool":"list_unread"}
{"tool":"draft_reply","text":"..."}
Or answer directly: {"reply":"..."}
window may be unread, 24h, or 7d.
Never post to a channel. draft_reply is a suggestion only.`;

@Injectable()
export class AiOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private recapTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mentions: MentionsService,
    private readonly context: AiContextService,
    private readonly llm: LlmService,
    private readonly realtime: RealtimeService,
    private readonly assistant: AiAssistantService,
    private readonly tools: AiToolsService,
    private readonly config: ConfigService,
    private readonly conversations: ConversationsService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messages: MessagesService,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<string>('AI_DAILY_RECAP');
    if (enabled !== 'true' && enabled !== '1') return;
    const ms = 24 * 60 * 60 * 1000;
    this.recapTimer = setInterval(() => {
      void this.sendDailyRecaps().catch((err) =>
        this.logger.error(`Daily recap failed: ${(err as Error).message}`),
      );
    }, ms);
  }

  onMessageCreated(message: Message): void {
    void this.handle(message).catch((err) => {
      this.logger.error(`AI teammate failed: ${(err as Error).message}`);
    });
  }

  async sendDailyRecaps(): Promise<number> {
    if (!this.llm.isEnabled()) return 0;
    const humans = await this.prisma.user.findMany({
      where: { id: { not: { startsWith: 'usr-agent-' } } },
    });
    let sent = 0;
    for (const user of humans) {
      await this.sendDailyRecapForUser({
        id: user.id,
        workplaceId: user.workplaceId,
      });
      sent += 1;
    }
    return sent;
  }

  /** Send a daily recap DM only for the requesting user (scoped HTTP entry). */
  async sendDailyRecapForUser(user: { id: string; workplaceId: string }): Promise<number> {
    if (!this.llm.isEnabled()) return 0;
    const { recap } = await this.assistant.recap({
      id: user.id,
      workplaceId: user.workplaceId,
    });
    const convo = await this.conversations.create({
      participants: [user.id, 'usr-agent-workspace'],
      workplaceId: user.workplaceId,
    });
    await this.messages.create('usr-agent-workspace', {
      content: `**Daily recap**\n\n${recap}`,
      conversationId: convo.id,
    });
    return 1;
  }

  private async handle(message: Message): Promise<void> {
    if (!this.llm.isEnabled()) return;
    if (isAgentUserId(message.senderId)) return;
    if (!message.content?.trim()) return;

    const agentId = await this.resolveAgent(message);
    if (!agentId) return;

    if (isWorkspaceAgent(agentId) && message.channelId) {
      return;
    }

    const persona = AGENT_PERSONAS[agentId];
    const target = {
      channelId: message.channelId,
      conversationId: message.conversationId,
    };

    this.realtime.emitToChat(target, 'typing:started', {
      userId: agentId,
      userName: persona.name,
      channelId: message.channelId,
      conversationId: message.conversationId,
    });

    try {
      const transcript = await this.context.buildTranscript({
        userId: message.senderId,
        channelId: message.channelId,
        conversationId: message.conversationId,
        parentMessageId: message.parentMessageId,
      });

      const reply = await this.buildReply(agentId, message, transcript);
      if (!reply) return;

      await this.messages.create(agentId, {
        content: reply,
        channelId: message.channelId,
        conversationId: message.conversationId,
        parentMessageId: message.parentMessageId ?? (message.channelId ? message.id : undefined),
      });
    } catch (err) {
      this.logger.error(`AI response error for agent ${agentId}: ${(err as Error).message}`, (err as Error).stack);
      try {
        await this.messages.create(agentId, {
          content: `I'm having a brief issue generating a response. Please try again!`,
          channelId: message.channelId,
          conversationId: message.conversationId,
          parentMessageId: message.parentMessageId ?? (message.channelId ? message.id : undefined),
        });
      } catch (innerErr) {
        this.logger.error(`Failed to post AI error fallback: ${(innerErr as Error).message}`);
      }
    } finally {
      this.realtime.emitToChat(target, 'typing:stopped', {
        userId: agentId,
        channelId: message.channelId,
        conversationId: message.conversationId,
      });
    }
  }

  private async buildReply(agentId: AgentUserId, message: Message, transcript: string): Promise<string> {
    if (agentId === 'usr-agent-research') {
      const workplaceId =
        (await this.prisma.user.findUnique({ where: { id: message.senderId }, select: { workplaceId: true } }))
          ?.workplaceId || 'ws-acme-hq-dev';
      const { answer } = await this.assistant.researchReply(
        message.senderId,
        workplaceId,
        message.content,
        transcript,
      );
      return answer;
    }

    if (agentId === 'usr-agent-meeting') {
      return this.llm.complete([
        { role: 'system', content: AGENT_PERSONAS['usr-agent-meeting'].system },
        {
          role: 'user',
          content: `Turn this thread/chat into meeting notes.\n\nTranscript:\n${transcript}\n\nLatest from ${message.senderName}:\n${message.content}`,
        },
      ]);
    }

    if (agentId === 'usr-agent-workspace') {
      return this.runWorkspaceAgent(message, transcript);
    }

    return this.llm.complete([
      { role: 'system', content: AGENT_PERSONAS[agentId].system },
      {
        role: 'user',
        content: `Recent transcript:\n${transcript}\n\nLatest message from ${message.senderName}:\n${message.content}\n\nReply as ${AGENT_PERSONAS[agentId].name}.`,
      },
    ]);
  }

  private async runWorkspaceAgent(message: Message, transcript: string): Promise<string> {
    const workplaceId =
      (await this.prisma.user.findUnique({ where: { id: message.senderId }, select: { workplaceId: true } }))
        ?.workplaceId || 'ws-acme-hq-dev';

    const first = await this.llm.complete([
      { role: 'system', content: WORKSPACE_TOOL_PROMPT },
      {
        role: 'user',
        content: `DM transcript:\n${transcript}\n\nUser (${message.senderName}): ${message.content}`,
      },
    ]);

    const parsed = this.tools.parseToolCall(first);
    if (!parsed) return first;
    if ('reply' in parsed) return parsed.reply;

    const toolResult = await this.tools.execute(message.senderId, workplaceId, parsed);
    return this.llm.complete([
      { role: 'system', content: WORKSPACE_TOOL_PROMPT },
      {
        role: 'user',
        content: `User said: ${message.content}\n\nTool ${parsed.tool} result:\n${toolResult}\n\nNow answer the user as JSON {"reply":"..."} using this evidence. If this was draft_reply, show the draft and say they must send it themselves.`,
      },
    ]).then((raw) => {
      const again = this.tools.parseToolCall(raw);
      return again && 'reply' in again ? again.reply : raw;
    });
  }

  private async resolveAgent(message: Message): Promise<AgentUserId | null> {
    const text = message.content?.trim() || '';

    // Check slash commands (e.g. /research, /meeting, /support, /workspace, /notes, /ResearchAgent)
    const slashMatches = text.match(/\/([a-zA-Z0-9_-]+)/g);
    if (slashMatches) {
      for (const sm of slashMatches) {
        const cmd = sm.slice(1).toLowerCase();
        if (cmd === 'research' || cmd === 'researchagent') return 'usr-agent-research';
        if (cmd === 'meeting' || cmd === 'meetingagent' || cmd === 'notes' || cmd === 'notesagent') return 'usr-agent-meeting';
        if (cmd === 'support' || cmd === 'supportagent') return 'usr-agent-support';
        if (cmd === 'workspace' || cmd === 'workspaceagent') return 'usr-agent-workspace';
      }
    }

    const names = this.mentions.extractMentions(message.content);
    const mentioned = await this.agentFromNames(names);
    if (mentioned) return mentioned;

    if (message.parentMessageId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: message.parentMessageId },
      });
      if (parent && isAgentUserId(parent.senderId)) return parent.senderId;
      if (parent) {
        const fromParent = await this.agentFromNames(this.mentions.extractMentions(parent.content));
        if (fromParent) return fromParent;
      }
    }

    if (!message.conversationId) return null;

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: message.conversationId },
    });
    const agentParticipant = participants.find((p) => isAgentUserId(p.userId));
    if (!agentParticipant) return null;
    return agentParticipant.userId as AgentUserId;
  }

  private async agentFromNames(names: string[]): Promise<AgentUserId | null> {
    if (names.length === 0) return null;
    const users = await this.prisma.user.findMany({
      where: { id: { startsWith: 'usr-agent-' } },
    });
    const byName = new Map(users.map((u) => [u.name.toLowerCase(), u]));
    for (const name of names) {
      const user = byName.get(name.toLowerCase());
      if (user && isAgentUserId(user.id)) return user.id;
    }
    return null;
  }
}
