import { Module, Global } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { RealtimeService } from './realtime.service';
import { PresenceModule } from '../presence/presence.module';

@Global()
@Module({
  imports: [PresenceModule],
  providers: [ChatGateway, RealtimeService],
  exports: [ChatGateway, RealtimeService],
})
export class RealtimeModule {}
