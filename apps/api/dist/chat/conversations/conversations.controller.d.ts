import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    findAll(): Promise<import("@team-chat/shared").Conversation[]>;
    findOne(id: string): Promise<import("@team-chat/shared").Conversation>;
    create(body: CreateConversationDto): Promise<import("@team-chat/shared").Conversation>;
}
