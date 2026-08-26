import { Controller, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CurrentUser } from '../../common/decorators';
import { MessageAccessGuard } from '../../common/guards';
import type { RequestUser } from '../../common/request-user';

@Controller('reactions')
@UseGuards(MessageAccessGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':messageId')
  async addReaction(
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reactionsService.addReaction(messageId, emoji, user);
  }

  @Delete(':messageId/:emoji')
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reactionsService.removeReaction(messageId, emoji, user);
  }
}

