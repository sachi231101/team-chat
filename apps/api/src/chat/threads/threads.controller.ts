import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { MessageAccessGuard } from '../../common/guards';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get(':parentMessageId/replies')
  @UseGuards(MessageAccessGuard)
  async findReplies(@Param('parentMessageId') parentMessageId: string) {
    return this.threadsService.findReplies(parentMessageId);
  }
}
