import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import { RequestUser, normalizeUser } from '../common/request-user';
import { PrismaService } from '../common/prisma.service';
import { ChatAccessService } from '../common/chat-access.service';
import { MessagesService } from '../chat/messages/messages.service';
import { SearchService } from '../search/search.service';
import { UPLOAD_DIR } from '../attachments/attachments.service';
import { AiContextService } from './ai-context.service';
import { NvidiaLlmService } from './nvidia-llm.service';
import type { SummarizeWindow } from './ai.constants';
import { AGENT_PERSONAS } from './ai.constants';

export type Citation = {
  index: number;
  messageId: string;
  senderName: string;
  content: string;
  channelId?: string;
  channelName?: string;
  conversationId?: string;
  createdAt: string;
};

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private readonly llm: NvidiaLlmService,
    private readonly context: AiContextService,
    private readonly search: SearchService,
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messages: MessagesService,
  ) {}

  async ask(
    rawUser: RequestUser | { id?: string; userId?: string; workplaceId?: string },
    question: string,
    channelId?: string,
    conversationId?: string,
  ) {
    const user = normalizeUser(rawUser);
    const hits = await this.search.search(question, user.userId, user.workplaceId);
    const scoped = hits.messages.slice(0, 15);
    const retrieved = scoped
      .map((m, i) => `[${i + 1}] #${(m as any).channelName || 'chat'} ${m.senderName} (${m.createdAt}): ${m.content}`)
      .join('\n');

    const extraContext =
      channelId || conversationId
        ? await this.context.buildTranscript({
            userId: user.userId,
            channelId,
            conversationId,
          })
        : '';

    const answer = await this.llm.complete([
      {
        role: 'system',
        content:
          'You answer questions about a Team Chat workspace using only the retrieved messages. Cite sources like [1], [2]. If the evidence is weak, say you are not sure. Do not invent messages.',
      },
      {
        role: 'user',
        content: `User question: ${question}\n\nRetrieved messages:\n${
          retrieved || '(none)'
        }${extraContext ? `\n\nRecent context in this view:\n${extraContext}` : ''}`,
      },
    ]);

    return {
      answer,
      citations: scoped.map((m, i) => ({
        index: i + 1,
        messageId: m.id,
        senderName: m.senderName,
        content: m.content.slice(0, 240),
        channelId: m.channelId,
        channelName: (m as any).channelName,
        conversationId: m.conversationId,
        createdAt: m.createdAt,
      })) as Citation[],
    };
  }

  async summarize(
    rawUser: RequestUser | { id?: string; userId?: string; workplaceId?: string },
    body: {
      window: SummarizeWindow;
      channelId?: string;
      conversationId?: string;
      parentMessageId?: string;
      postAsMessage?: boolean;
      pin?: boolean;
    },
  ) {
    const user = normalizeUser(rawUser);
    if (!body.channelId && !body.conversationId && !body.parentMessageId) {
      throw new BadRequestException('channelId, conversationId, or parentMessageId is required');
    }

    const lines = await this.context.collectMessages({
      userId: user.userId,
      channelId: body.channelId,
      conversationId: body.conversationId,
      parentMessageId: body.parentMessageId,
      window: body.window,
      take: 80,
    });
    const transcript = this.context.format(lines);
    const citations = this.context.citationsFrom(lines);

    const summary = await this.llm.complete([
      {
        role: 'system',
        content:
          'You catch teammates up on a Team Chat conversation. Write short sections: What happened, Decisions, Action items, Open questions. Cite sources like [1] when you reference a message. Stay faithful to the transcript.',
      },
      {
        role: 'user',
        content: `Summarize this ${body.window} window:\n\n${transcript}`,
      },
    ]);

    let postedMessageId: string | undefined;
    if (body.postAsMessage && (body.channelId || body.conversationId)) {
      const posted = await this.messages.create(user, {
        content: `**Catch-up (${body.window})**\n\n${summary}`,
        channelId: body.channelId,
        conversationId: body.conversationId,
        parentMessageId: body.parentMessageId,
      });
      postedMessageId = posted.id;
      if (body.pin) {
        await this.messages.togglePin(posted.id, user);
      }
    }

    return { summary, citations, postedMessageId };
  }

  async recap(rawUser: RequestUser | { id?: string; userId?: string; workplaceId?: string }) {
    const user = normalizeUser(rawUser);
    const person = await this.prisma.user.findUnique({ where: { id: user.userId } });
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId: user.userId, channel: { workplaceId: user.workplaceId } },
      select: { channelId: true },
    });
    const channelIds = memberships.map((m) => m.channelId);
    const recent = await this.prisma.message.findMany({
      where: {
        deletedAt: null,
        channelId: { in: channelIds },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { sender: true, channel: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    const transcript = recent
      .map((m, i) => `[${i + 1}] #${m.channel?.name || 'channel'} ${m.sender?.name}: ${m.content}`)
      .join('\n');

    const recap = await this.llm.complete([
      {
        role: 'system',
        content:
          'Write a personal daily recap of workspace activity from the last 24 hours. Group by channel. Be concise. Cite [n] when useful. If there is little evidence, say so.',
      },
      {
        role: 'user',
        content: `Daily recap for ${person?.name || 'teammate'}:\n\n${transcript || '(no messages in last 24h)'}`,
      },
    ]);

    return {
      recap,
      citations: recent.map((m, i) => ({
        index: i + 1,
        messageId: m.id,
        senderName: m.sender?.name || 'Unknown',
        content: m.content.slice(0, 240),
        channelId: m.channelId ?? undefined,
        conversationId: m.conversationId ?? undefined,
        createdAt: m.createdAt.toISOString(),
      })) as Citation[],
    };
  }

  async meetingNotes(user: RequestUser, body: {
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    transcript?: string;
    postAsMessage?: boolean;
  }) {
    const source =
      body.transcript?.trim() ||
      (await this.context.buildTranscript({
        userId: user.id,
        channelId: body.channelId,
        conversationId: body.conversationId,
        parentMessageId: body.parentMessageId,
        take: 80,
      }));

    const notes = await this.llm.complete([
      { role: 'system', content: AGENT_PERSONAS['usr-agent-meeting'].system },
      {
        role: 'user',
        content: `Turn this huddle/chat transcript into meeting notes:\n\n${source}`,
      },
    ]);

    let postedMessageId: string | undefined;
    if (body.postAsMessage && (body.channelId || body.conversationId)) {
      const posted = await this.messages.create('usr-agent-meeting', {
        content: notes,
        channelId: body.channelId,
        conversationId: body.conversationId,
        parentMessageId: body.parentMessageId,
      });
      postedMessageId = posted.id;
    }

    return { notes, postedMessageId };
  }

  async summarizeFile(
    user: { id: string; workplaceId: string },
    body: { name: string; url?: string; type?: string },
  ) {
    let extracted = '';
    if (body.url?.startsWith('/uploads/')) {
      try {
        await this.chatAccess.assertAttachmentAccess(user, body.url);
      } catch {
        return {
          summary: await this.llm.complete([
            {
              role: 'system',
              content:
                'Summarize a shared workplace file from metadata only. Return a short summary.',
            },
            {
              role: 'user',
              content: `File: ${body.name}\nType: ${body.type || 'unknown'}\n(No accessible file contents.)`,
            },
          ]),
        };
      }

      const filePath = join(UPLOAD_DIR, basename(body.url));
      const textLike =
        !body.type ||
        body.type.startsWith('text/') ||
        body.type.includes('json') ||
        body.name.endsWith('.md') ||
        body.name.endsWith('.txt') ||
        body.name.endsWith('.csv');
      if (textLike && existsSync(filePath)) {
        extracted = readFileSync(filePath, 'utf8').slice(0, 12000);
      }
    }

    const summary = await this.llm.complete([
      {
        role: 'system',
        content:
          'Summarize a shared workplace file. If only metadata is available, say so and summarize from the name. Return a short summary.',
      },
      {
        role: 'user',
        content: `File: ${body.name}\nType: ${body.type || 'unknown'}\n\n${
          extracted ? `Contents:\n${extracted}` : '(No text contents available.)'
        }`,
      },
    ]);

    return { summary };
  }

  async researchReply(userId: string, workplaceId: string, question: string, extraTranscript: string) {
    const hits = await this.search.search(question, userId, workplaceId);
    const scoped = hits.messages.slice(0, 15);
    const retrieved = scoped
      .map((m, i) => `[${i + 1}] ${m.senderName} (${m.createdAt}): ${m.content}`)
      .join('\n');

    const answer = await this.llm.complete([
      { role: 'system', content: AGENT_PERSONAS['usr-agent-research'].system },
      {
        role: 'user',
        content: `Question: ${question}\n\nRetrieved messages:\n${retrieved || '(none)'}\n\nLocal transcript:\n${extraTranscript}`,
      },
    ]);

    const citationFooter =
      scoped.length > 0
        ? `\n\nSources: ${scoped.map((m, i) => `[${i + 1}] ${m.senderName}`).join(', ')}`
        : '';

    return {
      answer: `${answer}${citationFooter}`,
      citations: scoped,
    };
  }
}
