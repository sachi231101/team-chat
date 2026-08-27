import type { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { ChatAccessService } from '../common/chat-access.service';
import type { RequestUser } from '../common/request-user';
export declare class AttachmentsController {
    private readonly chatAccess;
    private readonly attachments;
    constructor(chatAccess: ChatAccessService, attachments: AttachmentsService);
    upload(file: Express.Multer.File, user: RequestUser): {
        name: string;
        size: number;
        type: string;
        url: string;
    };
    download(filename: string, user: RequestUser, res: Response): Promise<void>;
    verifyAccess(id: string, user: RequestUser): Promise<{
        allowed: boolean;
        attachmentId: string;
    }>;
    private assertDownloadAccess;
}
export declare class UploadsController {
    private readonly chatAccess;
    private readonly attachments;
    constructor(chatAccess: ChatAccessService, attachments: AttachmentsService);
    download(filename: string, user: RequestUser, queryUserId: string | undefined, queryWorkplaceId: string | undefined, res: Response): Promise<void>;
}
