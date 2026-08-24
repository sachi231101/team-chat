import {
  Body,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';
import { MessageAccessGuard } from '../common/guards';
import { NvidiaLlmService } from './nvidia-llm.service';
import { AiContextService } from './ai-context.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ComposeAiDto } from './dto/compose-ai.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { SummarizeAiDto } from './dto/summarize-ai.dto';
import { MeetingNotesDto } from './dto/meeting-notes.dto';
import { SummarizeFileDto } from './dto/summarize-file.dto';

const COMPOSE_PROMPTS: Record<ComposeAiDto['action'], string> = {
  improve: 'Rewrite the draft to be clearer, professional, and concise. Keep the original meaning. Return only the rewritten message.',
  shorten: 'Shorten the draft without losing key meaning. Return only the rewritten message.',
  expand: 'Expand the draft with a bit more helpful detail while staying natural. Return only the rewritten message.',
  translate: 'Translate the draft into clear English if it is not English; if it already is English, keep it English and polish lightly. Return only the rewritten message.',
  summarize: 'Summarize the draft in 1–3 short sentences. Return only the summary.',
  casual: 'Rewrite the draft in a casual, friendly teammate tone. Keep meaning. Return only the rewritten message.',
  exec: 'Rewrite the draft for an executive: short, clear, decision-oriented. Return only the rewritten message.',
};

@Controller('ai')
@Throttle({ default: { limit: 30, ttl: 3_600_000 } })
export class AiController {
  constructor(
    private readonly llm: NvidiaLlmService,
    private readonly context: AiContextService,
    private readonly assistant: AiAssistantService,
    private readonly orchestrator: AiOrchestratorService,
  ) {}

  @Get('status')
  status() {
    return this.llm.status();
  }

  @Post('compose')
  @UseGuards(MessageAccessGuard)
  async compose(@CurrentUser() user: RequestUser, @Body() body: ComposeAiDto) {
    this.assertReady();

    let contextBlock = '';
    if (body.channelId || body.conversationId || body.parentMessageId) {
      contextBlock = await this.context.buildTranscript({
        userId: user.id,
        channelId: body.channelId,
        conversationId: body.conversationId,
        parentMessageId: body.parentMessageId,
      });
    }

    const text = await this.llm.complete([
      {
        role: 'system',
        content:
          'You help a teammate draft a chat message. Return only the suggested text, no quotes or preamble.',
      },
      {
        role: 'user',
        content: `${COMPOSE_PROMPTS[body.action]}\n\n${
          contextBlock ? `Recent conversation:\n${contextBlock}\n\n` : ''
        }Draft:\n${body.text}`,
      },
    ]);

    return { text };
  }

  @Post('ask')
  async ask(@CurrentUser() user: RequestUser, @Body() body: AskAiDto) {
    this.assertReady();
    return this.assistant.ask(user, body.question, body.channelId, body.conversationId);
  }

  @Post('summarize')
  @UseGuards(MessageAccessGuard)
  async summarize(@CurrentUser() user: RequestUser, @Body() body: SummarizeAiDto) {
    this.assertReady();
    return this.assistant.summarize(user, body);
  }

  @Post('recap')
  async recap(@CurrentUser() user: RequestUser) {
    this.assertReady();
    return this.assistant.recap(user);
  }

  @Post('recap/send')
  async sendRecaps() {
    this.assertReady();
    const sent = await this.orchestrator.sendDailyRecaps();
    return { sent };
  }

  @Post('meeting-notes')
  @UseGuards(MessageAccessGuard)
  async meetingNotes(@CurrentUser() user: RequestUser, @Body() body: MeetingNotesDto) {
    this.assertReady();
    return this.assistant.meetingNotes(user, body);
  }

  @Post('summarize-file')
  async summarizeFile(@Body() body: SummarizeFileDto) {
    this.assertReady();
    return this.assistant.summarizeFile(body);
  }

  private assertReady() {
    if (!this.llm.isEnabled()) {
      throw new ServiceUnavailableException(
        'AI is unavailable. Set AI_API_KEY and AI_ENABLED=true.',
      );
    }
  }
}
