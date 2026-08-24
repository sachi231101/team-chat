import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import type { RequestUser } from '../../common/request-user';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    findAll(user: RequestUser): Promise<import("@team-chat/shared").Conversation[]>;
    findOne(id: string, user: RequestUser): Promise<import("@team-chat/shared").Conversation>;
    create(user: RequestUser, body: CreateConversationDto): Promise<import("@team-chat/shared").Conversation>;
}
