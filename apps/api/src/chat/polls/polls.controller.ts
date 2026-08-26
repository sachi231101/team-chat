import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { PollsService, PollStats } from './polls.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/request-user';

@Controller('polls')

export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  async createPoll(
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      question: string;
      options: string[];
      isMultiChoice?: boolean;
      isAnonymous?: boolean;
      channelId?: string;
      conversationId?: string;
    },
  ): Promise<PollStats> {
    return this.pollsService.createPoll(user, body);
  }

  @Get(':id')
  async getPoll(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<PollStats> {
    return this.pollsService.getPoll(user, id);
  }

  @Post(':id/vote')
  async vote(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { optionIndex: number },
  ): Promise<PollStats> {
    return this.pollsService.vote(user, id, body.optionIndex);
  }

  @Patch(':id/close')
  async closePoll(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { isClosed?: boolean },
  ): Promise<PollStats> {
    return this.pollsService.closePoll(user, id, body.isClosed ?? true);
  }
}
