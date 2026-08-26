import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { RequestUser } from '../../common/request-user';

@Injectable()
export class ReactionsService {
  constructor(private readonly messagesService: MessagesService) {}

  async addReaction(messageId: string, emoji: string, user: RequestUser | string) {
    const updated = await this.messagesService.toggleReaction(messageId, emoji, user);
    return { success: true, message: updated };
  }

  async removeReaction(messageId: string, emoji: string, user: RequestUser | string) {
    const updated = await this.messagesService.toggleReaction(messageId, emoji, user);
    return { success: true, message: updated };
  }
}

