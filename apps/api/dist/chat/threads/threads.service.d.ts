import { MessagesService } from '../messages/messages.service';
import { Message } from '@team-chat/shared';
export declare class ThreadsService {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findReplies(parentMessageId: string): Promise<Message[]>;
}
