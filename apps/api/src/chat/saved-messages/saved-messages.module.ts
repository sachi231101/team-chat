import { Module } from '@nestjs/common';
import { SavedMessagesController } from './saved-messages.controller';
import { SavedMessagesService } from './saved-messages.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [MessagesModule],
  controllers: [SavedMessagesController],
  providers: [SavedMessagesService],
  exports: [SavedMessagesService],
})
export class SavedMessagesModule {}
