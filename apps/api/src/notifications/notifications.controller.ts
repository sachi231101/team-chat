import { Controller, Get, Patch, Param, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser) {
    return this.notificationsService.findAll(user.id);
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
