import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CurrentUser } from '../../common/decorators';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':messageId')
  async addReaction(
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.reactionsService.addReaction(messageId, emoji, user.id);
  }

  @Delete(':messageId/:emoji')
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.reactionsService.removeReaction(messageId, emoji, user.id);
  }
}
