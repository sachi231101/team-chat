import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SavedMessagesService } from './saved-messages.service';
import { CurrentUser } from '../../common/decorators';
import type { RequestUser } from '../../common/request-user';
import { MessageAccessGuard } from '../../common/guards';

@Controller('saved-messages')
export class SavedMessagesController {
  constructor(private readonly savedMessages: SavedMessagesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.savedMessages.listMessages(user.id);
  }

  @Get('ids')
  listIds(@CurrentUser() user: RequestUser) {
    return this.savedMessages.listIds(user.id);
  }

  @Post()
  @UseGuards(MessageAccessGuard)
  toggle(
    @CurrentUser() user: RequestUser,
    @Body() body: { messageId: string },
  ) {
    return this.savedMessages.toggle(user.id, body.messageId);
  }

  @Delete(':messageId')
  @UseGuards(MessageAccessGuard)
  async unsave(
    @CurrentUser() user: RequestUser,
    @Param('messageId') messageId: string,
  ) {
    return this.savedMessages.toggle(user.id, messageId);
  }
}
