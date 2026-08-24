import { PrismaService } from '../../common/prisma.service';
import { Message } from '@team-chat/shared';
export declare class MentionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    extractMentions(content: string): string[];
    notifyFromMessage(message: Message): Promise<void>;
}
