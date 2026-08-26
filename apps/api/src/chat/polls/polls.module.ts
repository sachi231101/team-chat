import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { RealtimeModule } from '../../realtime/realtime.module';


@Module({
  imports: [RealtimeModule],
  controllers: [PollsController],
  providers: [PollsService, PrismaService, ChatAccessService],
  exports: [PollsService],
})
export class PollsModule {}
