import { Controller, Get, Param } from '@nestjs/common';
import { ThreadsService } from './threads.service';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get(':parentMessageId/replies')
  async findReplies(@Param('parentMessageId') parentMessageId: string) {
    return this.threadsService.findReplies(parentMessageId);
  }
}
