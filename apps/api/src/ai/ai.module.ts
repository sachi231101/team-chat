import { Module, forwardRef } from '@nestjs/common';
import { MessagesModule } from '../chat/messages/messages.module';
import { MentionsModule } from '../chat/mentions/mentions.module';
import { SearchModule } from '../search/search.module';
import { ConversationsModule } from '../chat/conversations/conversations.module';
import { AiController } from './ai.controller';
import { AiContextService } from './ai-context.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiToolsService } from './ai-tools.service';
import { NvidiaLlmService } from './nvidia-llm.service';

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    MentionsModule,
    SearchModule,
    ConversationsModule,
  ],
  controllers: [AiController],
  providers: [
    NvidiaLlmService,
    AiContextService,
    AiAssistantService,
    AiToolsService,
    AiOrchestratorService,
  ],
  exports: [AiOrchestratorService, NvidiaLlmService],
})
export class AiModule {}
