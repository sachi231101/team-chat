import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ToggleReactionDto } from '../reactions/dto/toggle-reaction.dto';
import { MessageAccessGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import type { RequestUser } from '../../common/request-user';

@Controller('messages')
@UseGuards(MessageAccessGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query('conversationId') conversationId?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.findAll(
      user,
      channelId,
      conversationId,
      limit,
      cursor,
    );
  }

  @Get('sync')
  sync(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query('conversationId') conversationId?: string,
    @Query('since') since?: string,
  ) {
    return this.messagesService.syncSince(user, channelId, conversationId, since);
  }

  @Get('pinned')
  findPinned(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query('conversationId') conversationId?: string,
  ) {
    if (!channelId && !conversationId) {
      return this.messagesService.findPinnedForUser(user);
    }
    return this.messagesService.findPinned(channelId, conversationId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.messagesService.findOne(id, user);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: CreateMessageDto) {
    return this.messagesService.create(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: EditMessageDto,
  ) {
    return this.messagesService.update(id, body.content, user);
  }

  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.messagesService.delete(id, user);
  }

  @Patch(':id/pin')
  togglePin(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.messagesService.togglePin(id, user);
  }

  @Post(':id/reactions')
  toggleReaction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: ToggleReactionDto,
  ) {
    return this.messagesService.toggleReaction(id, body.emoji, user);
  }

  @Get(':id/replies')
  getReplies(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.messagesService.getReplies(id, user);
  }

  @Post(':id/read')
  markAsRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.messagesService.markAsRead(id, user);
  }
}

