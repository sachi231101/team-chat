import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddChannelMembersDto } from './dto/add-member.dto';
import { ChannelMemberGuard } from '../../common/guards';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { RequestUser } from '../../common/request-user';
import { WorkplaceReadCacheInterceptor } from '../../redis/workplace-read-cache.interceptor';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @UseInterceptors(WorkplaceReadCacheInterceptor)
  findAll(@CurrentUser() user: RequestUser) {
    return this.channelsService.findAll(user.workplaceId, user.userId);
  }

  @Get(':id')
  @UseGuards(ChannelMemberGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.channelsService.findOne(id, user.workplaceId);
  }

  @Post()
  @RequirePermissions('channel:create')
  create(@CurrentUser() user: RequestUser, @Body() body: CreateChannelDto) {
    return this.channelsService.create({
      ...body,
      createdById: user.userId,
      workplaceId: user.workplaceId,
    });
  }

  @Get(':id/members')
  @UseGuards(ChannelMemberGuard)
  getMembers(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.channelsService.getMembers(id, user);
  }

  @Post(':id/members')
  @UseGuards(ChannelMemberGuard)
  addMembers(
    @Param('id') id: string,
    @Body() body: AddChannelMembersDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.channelsService.addMembers(id, body.userIds, user);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ChannelMemberGuard)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.channelsService.removeMember(id, userId, user);
  }
}
