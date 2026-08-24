import { AttachmentsService } from './attachments.service';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    getPresignedUrl(fileName: string, mimeType: string): Promise<{
        uploadUrl: string;
        fileUrl: string;
        attachmentId: string;
    }>;
}
