import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { ToggleTagDto } from './dto/toggle-tag.dto';
import { CurrentUser } from '../../common/decorators';
import type { RequestUser } from '../../common/request-user';

@Controller('chat/tags')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post(':messageId/toggle')
  async toggle(
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ToggleTagDto,
  ) {
    return this.tagsService.toggleTag(messageId, user, dto);
  }

  @Get('decisions')
  async findDecisions(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query('conversationId') conversationId?: string,
  ) {
    return this.tagsService.findDecisions(channelId, conversationId, user);
  }
}

