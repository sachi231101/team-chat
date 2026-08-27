import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationParticipantGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import type { RequestUser } from '../../common/request-user';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.conversationsService.findAll(user.workplaceId, user.userId);
  }

  @Get(':id')
  @UseGuards(ConversationParticipantGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.conversationsService.findOne(id, user.workplaceId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: CreateConversationDto) {
    const participants = Array.from(new Set([user.userId, ...(body.participants || [])]));
    return this.conversationsService.create({
      participants,
      workplaceId: user.workplaceId,
    });
  }
}
