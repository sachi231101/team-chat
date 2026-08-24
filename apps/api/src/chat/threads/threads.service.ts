import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { Message } from '@team-chat/shared';

@Injectable()
export class ThreadsService {
  constructor(private readonly messagesService: MessagesService) {}

  async findReplies(parentMessageId: string): Promise<Message[]> {
    return this.messagesService.getReplies(parentMessageId);
  }
}
