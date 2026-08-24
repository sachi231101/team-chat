import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { MessagesModule } from '../chat/messages/messages.module';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [MessagesModule, PresenceModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class RealtimeModule {}
