import { ChatAccessService } from '../common/chat-access.service';
import type { RequestUser } from '../common/request-user';
export declare class AttachmentsController {
    private readonly chatAccess;
    constructor(chatAccess: ChatAccessService);
    upload(file: Express.Multer.File): {
        name: string;
        size: number;
        type: string;
        url: string;
    };
    verifyAccess(id: string, user: RequestUser): Promise<{
        allowed: boolean;
        attachmentId: string;
    }>;
}
