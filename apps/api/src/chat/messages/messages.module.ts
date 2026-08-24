import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MentionsModule } from '../mentions/mentions.module';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
  imports: [MentionsModule, RealtimeModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
