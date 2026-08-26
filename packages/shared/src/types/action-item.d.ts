export type ActionItemStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export interface ActionItem {
    id: string;
    title: string;
    description?: string;
    status: ActionItemStatus;
    dueDate?: string;
    assigneeId?: string;
    assigneeName?: string;
    assigneeAvatar?: string;
    creatorId: string;
    creatorName?: string;
    messageId?: string;
    messageSnippet?: string;
    channelId?: string;
    conversationId?: string;
    workplaceId: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateActionItemDto {
    title: string;
    description?: string;
    status?: ActionItemStatus;
    dueDate?: string;
    assigneeId?: string;
    messageId?: string;
    channelId?: string;
    conversationId?: string;
}
export interface UpdateActionItemDto {
    title?: string;
    description?: string;
    status?: ActionItemStatus;
    dueDate?: string;
    assigneeId?: string | null;
}
