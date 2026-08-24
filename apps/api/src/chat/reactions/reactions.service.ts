import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class ReactionsService {
  constructor(private readonly messagesService: MessagesService) {}

  async addReaction(messageId: string, emoji: string, userId: string) {
    const updated = await this.messagesService.toggleReaction(messageId, emoji, userId);
    return { success: true, message: updated };
  }

  async removeReaction(messageId: string, emoji: string, userId: string) {
    const updated = await this.messagesService.toggleReaction(messageId, emoji, userId);
    return { success: true, message: updated };
  }
}
