export declare class AttachmentsService {
    getUploadUrl(fileName: string, mimeType: string): Promise<{
        uploadUrl: string;
        fileUrl: string;
        attachmentId: string;
    }>;
}
