declare class AttachmentInputDto {
    name: string;
    size: number;
    type: string;
    url: string;
}
export declare class CreateMessageDto {
    content?: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    attachments?: AttachmentInputDto[];
}
export {};
