export interface MessageReaction {
    id: string;
    emoji: string;
    userId: string;
    userName: string;
    createdAt: string;
}
export interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    previewUrl?: string;
    createdAt: string;
}
export interface Message {
    id: string;
    channelId?: string;
    conversationId?: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    parentMessageId?: string;
    replyCount?: number;
    lastReplyAt?: string;
    reactions: MessageReaction[];
    attachments?: Attachment[];
    pinned?: boolean;
    editedAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Conversation {
    id: string;
    participants: string[];
    workplaceId: string;
    lastMessage?: Message;
    unreadCount?: number;
    createdAt: string;
    updatedAt: string;
}
