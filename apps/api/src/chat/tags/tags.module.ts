import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { CommonModule } from '../../common/common.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [CommonModule, RealtimeModule, MessagesModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
