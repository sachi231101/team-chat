import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddChannelMembersDto } from './dto/add-member.dto';
import { ChannelMemberGuard } from '../../common/guards';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  @UseGuards(ChannelMemberGuard)
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateChannelDto) {
    return this.channelsService.create(body);
  }

  @Get(':id/members')
  @UseGuards(ChannelMemberGuard)
  getMembers(@Param('id') id: string) {
    return this.channelsService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(ChannelMemberGuard)
  addMembers(
    @Param('id') id: string,
    @Body() body: AddChannelMembersDto,
  ) {
    return this.channelsService.addMembers(id, body.userIds);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ChannelMemberGuard)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.channelsService.removeMember(id, userId);
  }
}
