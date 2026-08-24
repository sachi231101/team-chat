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
import { ChannelMemberGuard } from '../../common/guards';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @UseGuards(ChannelMemberGuard)
  findAll(
    @Query('channelId') channelId?: string,
    @Query('conversationId') conversationId?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.findAll(channelId, conversationId, limit, cursor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Post()
  @UseGuards(ChannelMemberGuard)
  create(@Body() body: CreateMessageDto) {
    return this.messagesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: EditMessageDto) {
    return this.messagesService.update(id, body.content);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.messagesService.delete(id);
  }

  @Patch(':id/pin')
  togglePin(@Param('id') id: string) {
    return this.messagesService.togglePin(id);
  }

  @Post(':id/reactions')
  toggleReaction(
    @Param('id') id: string,
    @Body() body: ToggleReactionDto,
  ) {
    return this.messagesService.toggleReaction(id, body.emoji, body.userId, body.userName);
  }

  @Get(':id/replies')
  getReplies(@Param('id') id: string) {
    return this.messagesService.getReplies(id);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(id);
  }

  @Post(':id/summarize')
  summarizeThread(@Param('id') id: string) {
    return this.messagesService.summarizeThread(id);
  }
}
