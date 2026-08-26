import { Module, forwardRef } from '@nestjs/common';
import { MessagesModule } from '../chat/messages/messages.module';
import { MentionsModule } from '../chat/mentions/mentions.module';
import { SearchModule } from '../search/search.module';
import { ConversationsModule } from '../chat/conversations/conversations.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AiController } from './ai.controller';
import { AiContextService } from './ai-context.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiToolsService } from './ai-tools.service';
import { NvidiaLlmService } from './nvidia-llm.service';
import { AiWorkExtractionService } from './ai-work-extraction.service';
import { AiBriefingService } from './ai-briefing.service';
import { AiMultiAgentService } from './ai-multi-agent.service';
import { AiSmartRoutingService } from './ai-smart-routing.service';
import { AiDecisionsService } from './ai-decisions.service';
import { AiLearningService } from './ai-learning.service';
import { AiTeammatesService } from './ai-teammates.service';

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    MentionsModule,
    SearchModule,
    ConversationsModule,
    RealtimeModule,
  ],
  controllers: [AiController],
  providers: [
    NvidiaLlmService,
    AiContextService,
    AiAssistantService,
    AiToolsService,
    AiOrchestratorService,
    AiWorkExtractionService,
    AiBriefingService,
    AiMultiAgentService,
    AiSmartRoutingService,
    AiDecisionsService,
    AiLearningService,
    AiTeammatesService,
  ],
  exports: [
    AiOrchestratorService,
    NvidiaLlmService,
    AiWorkExtractionService,
    AiBriefingService,
    AiMultiAgentService,
    AiSmartRoutingService,
    AiDecisionsService,
    AiLearningService,
    AiTeammatesService,
  ],
})
export class AiModule {}
