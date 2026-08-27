import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ActionsService } from './actions.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import type { ActionItemStatus } from '@team-chat/shared';
import { CurrentUser } from '../../common/decorators';
import type { RequestUser } from '../../common/request-user';

@Controller('chat/actions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query('conversationId') conversationId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: ActionItemStatus,
    @Query('messageId') messageId?: string,
  ) {
    return this.actionsService.findAll(user, {
      channelId,
      conversationId,
      assigneeId,
      status,
      messageId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.actionsService.findOne(id, user);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateActionItemDto,
  ) {
    return this.actionsService.create(user, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateActionItemDto,
  ) {
    return this.actionsService.update(id, user, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.actionsService.delete(id, user);
  }
}

