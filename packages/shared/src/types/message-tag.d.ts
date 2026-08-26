export type MessageTagType = 'DECISION' | 'KEY_TAKEAWAY' | 'ANNOUNCEMENT' | 'FOLLOW_UP';
export interface MessageTag {
    id: string;
    messageId: string;
    userId: string;
    userName?: string;
    tag: MessageTagType;
    note?: string;
    createdAt: string;
}
export interface ToggleMessageTagDto {
    tag: MessageTagType;
    note?: string;
}
