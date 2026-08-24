export declare class CreateMessageDto {
    content: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    attachments?: {
        name: string;
        size: number;
        type: string;
        url: string;
    }[];
}
