import { Controller, Get, Patch, Param, Body, ForbiddenException } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get()
  getAllPresence(@CurrentUser() user: RequestUser) {
    return this.presenceService.getAllPresence(user.workplaceId);
  }

  @Patch()
  setOwnPresence(@CurrentUser() user: RequestUser, @Body() body: UpdatePresenceDto) {
    return this.presenceService.setPresence(user.userId, body.status, body.statusMessage);
  }

  @Patch(':userId')
  setPresence(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdatePresenceDto,
    @Param('userId') userId: string,
  ) {
    if (userId !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own presence');
    }
    return this.presenceService.setPresence(userId, body.status, body.statusMessage);
  }
}
