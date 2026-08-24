import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get()
  getAllPresence() {
    return this.presenceService.getAllPresence();
  }

  @Patch(':userId')
  setPresence(
    @Param('userId') userId: string,
    @Body() body: UpdatePresenceDto,
  ) {
    return this.presenceService.setPresence(userId, body.status, body.statusMessage);
  }
}
