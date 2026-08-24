import { ThreadsService } from './threads.service';
export declare class ThreadsController {
    private readonly threadsService;
    constructor(threadsService: ThreadsService);
    findReplies(parentMessageId: string): Promise<import("@team-chat/shared").Message[]>;
}
