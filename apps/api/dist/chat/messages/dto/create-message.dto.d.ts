declare class AttachmentInputDto {
    name: string;
    size: number;
    type: string;
    url: string;
}
export declare class CreateMessageDto {
    clientMessageId?: string;
    content?: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    attachments?: AttachmentInputDto[];
}
export {};
