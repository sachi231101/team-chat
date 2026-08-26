import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { CommonModule } from '../../common/common.module';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
  imports: [CommonModule, RealtimeModule],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
