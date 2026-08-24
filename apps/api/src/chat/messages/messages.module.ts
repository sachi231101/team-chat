import { Module, forwardRef } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MentionsModule } from '../mentions/mentions.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AiModule } from '../../ai/ai.module';

@Module({
  imports: [MentionsModule, RealtimeModule, forwardRef(() => AiModule)],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
