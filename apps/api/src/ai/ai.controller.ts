import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';
import { MessageAccessGuard } from '../common/guards';
import { LlmService } from './llm/llm.service';
import { AiContextService } from './ai-context.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiWorkExtractionService } from './ai-work-extraction.service';
import { AiBriefingService } from './ai-briefing.service';
import { AiMultiAgentService } from './ai-multi-agent.service';
import { AiSmartRoutingService } from './ai-smart-routing.service';
import { AiDecisionsService } from './ai-decisions.service';
import { AiLearningService } from './ai-learning.service';
import { AiTeammatesService } from './ai-teammates.service';
import { ComposeAiDto } from './dto/compose-ai.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { SummarizeAiDto } from './dto/summarize-ai.dto';
import { MeetingNotesDto } from './dto/meeting-notes.dto';
import { SummarizeFileDto } from './dto/summarize-file.dto';
import {
  ExtractWorkDto,
  ApplyWorkDto,
  DailyBriefingDto,
  MultiAgentCoordinateDto,
  SmartRouteDto,
  CreateDecisionDto,
  UpdateDecisionDto,
  CreateCorrectionDto,
  CreateRuleDto,
  ExecuteAgentTaskDto,
} from './dto/ai-advantages.dto';

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
@Throttle({ default: { limit: 60, ttl: 3_600_000 } })
export class AiController {
  constructor(
    private readonly llm: LlmService,
    private readonly context: AiContextService,
    private readonly assistant: AiAssistantService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly workExtraction: AiWorkExtractionService,
    private readonly briefing: AiBriefingService,
    private readonly multiAgent: AiMultiAgentService,
    private readonly smartRouting: AiSmartRoutingService,
    private readonly decisions: AiDecisionsService,
    private readonly learning: AiLearningService,
    private readonly teammates: AiTeammatesService,
  ) {}

  @Get('status')
  status() {
    return this.llm.status();
  }

  // 1. Compose AI
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

  // 2. Company Memory (Ask AI with deep citations)
  @Post('ask')
  async ask(@CurrentUser() user: RequestUser, @Body() body: AskAiDto) {
    this.assertReady();
    return this.assistant.ask(user, body.question, body.channelId, body.conversationId);
  }

  // 3. Summarize Channel
  @Post('summarize')
  @UseGuards(MessageAccessGuard)
  async summarize(@CurrentUser() user: RequestUser, @Body() body: SummarizeAiDto) {
    this.assertReady();
    return this.assistant.summarize(user, body);
  }

  // 4. Daily Recap
  @Post('recap')
  async recap(@CurrentUser() user: RequestUser) {
    this.assertReady();
    return this.assistant.recap(user);
  }

  @Post('recap/send')
  async sendRecaps(@CurrentUser() user: RequestUser) {
    this.assertReady();
    const sent = await this.orchestrator.sendDailyRecapForUser(user);
    return { sent };
  }

  // 5. Meeting Notes
  @Post('meeting-notes')
  @UseGuards(MessageAccessGuard)
  async meetingNotes(@CurrentUser() user: RequestUser, @Body() body: MeetingNotesDto) {
    this.assertReady();
    return this.assistant.meetingNotes(user, body);
  }

  // 6. Summarize File
  @Post('summarize-file')
  async summarizeFile(@CurrentUser() user: RequestUser, @Body() body: SummarizeFileDto) {
    this.assertReady();
    return this.assistant.summarizeFile(user, body);
  }

  // ── AI ADVANTAGE 1: Conversation-to-work ────────────────────
  @Post('extract-work')
  async extractWork(@CurrentUser() user: RequestUser, @Body() body: ExtractWorkDto) {
    this.assertReady();
    return this.workExtraction.extractWork(user, body);
  }

  @Post('apply-work')
  async applyWork(@CurrentUser() user: RequestUser, @Body() body: ApplyWorkDto) {
    return this.workExtraction.applyWorkItems(user, body);
  }

  // ── AI ADVANTAGE 3: Daily Briefing ──────────────────────────
  @Get('briefing')
  async getDailyBriefing(
    @CurrentUser() user: RequestUser,
    @Query('timeframe') timeframe?: 'today' | '24h' | '7d',
  ) {
    return this.briefing.getDailyBriefing(user, timeframe || '24h');
  }

  @Post('briefing/generate')
  async generateDailyBriefing(
    @CurrentUser() user: RequestUser,
    @Body() body: DailyBriefingDto,
  ) {
    this.assertReady();
    return this.briefing.getDailyBriefing(user, body.timeframe || '24h');
  }

  // ── AI ADVANTAGE 4: AI Teammates & Tasks ────────────────────
  @Get('teammates')
  async getTeammates(@CurrentUser() user: RequestUser) {
    return this.teammates.getTeammates(user.workplaceId);
  }

  @Post('agents/execute-task')
  async executeAgentTask(
    @CurrentUser() user: RequestUser,
    @Body() body: ExecuteAgentTaskDto,
  ) {
    this.assertReady();
    return this.teammates.executeAssignedTask(user, body.actionItemId);
  }

  @Get('agents/task-progress/:actionItemId')
  async getAgentTaskProgress(
    @CurrentUser() user: RequestUser,
    @Param('actionItemId') actionItemId: string,
  ) {
    return this.teammates.checkProgress(user, actionItemId);
  }

  // ── AI ADVANTAGE 5: Multi-agent coordination ────────────────
  @Post('coordinate')
  async coordinateMultiAgent(
    @CurrentUser() user: RequestUser,
    @Body() body: MultiAgentCoordinateDto,
  ) {
    this.assertReady();
    return this.multiAgent.coordinate(user, body);
  }

  // ── AI ADVANTAGE 6: Smart routing ───────────────────────────
  @Post('smart-route')
  async smartRoute(@CurrentUser() user: RequestUser, @Body() body: SmartRouteDto) {
    this.assertReady();
    return this.smartRouting.analyzeAndRoute(user, body);
  }

  // ── AI ADVANTAGE 7: Decision capture ────────────────────────
  @Get('decisions')
  async getDecisions(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.decisions.getDecisions(user.workplaceId, { channelId, status, search });
  }

  @Post('decisions')
  async createDecision(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateDecisionDto,
  ) {
    return this.decisions.createDecision(user, body);
  }

  @Patch('decisions/:id')
  async updateDecision(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateDecisionDto,
  ) {
    return this.decisions.updateDecision(user, id, body);
  }

  @Delete('decisions/:id')
  async deleteDecision(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.decisions.deleteDecision(user, id);
  }

  @Post('decisions/detect')
  async detectDecisions(
    @CurrentUser() user: RequestUser,
    @Body() body: { channelId?: string; conversationId?: string; parentMessageId?: string; transcript?: string },
  ) {
    this.assertReady();
    return this.decisions.detectDecisions(user, body);
  }

  // ── AI ADVANTAGE 8: Learning from corrections ───────────────
  @Post('corrections')
  async recordCorrection(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateCorrectionDto,
  ) {
    return this.learning.recordCorrection(user, body);
  }

  @Get('rules')
  async getRules(@CurrentUser() user: RequestUser) {
    return this.learning.getRules(user.workplaceId);
  }

  @Post('rules')
  async createRule(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateRuleDto,
  ) {
    return this.learning.createRule(user.workplaceId, body.rule, body.category);
  }

  @Patch('rules/:id/toggle')
  async toggleRule(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    return this.learning.toggleRule(user, id, active);
  }

  @Delete('rules/:id')
  async deleteRule(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.learning.deleteRule(user, id);
  }

  private assertReady() {
    if (!this.llm.isEnabled()) {
      throw new ServiceUnavailableException(
        'AI is unavailable. Set GEMINI_API_KEY and AI_ENABLED=true.',
      );
    }
  }
}
