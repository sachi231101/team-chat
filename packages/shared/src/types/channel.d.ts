export type ChannelType = 'public' | 'private';
export interface ChannelMember {
    userId: string;
    channelId: string;
    role: 'admin' | 'member';
    joinedAt: string;
}
export interface Channel {
    id: string;
    name: string;
    description?: string;
    topic?: string;
    type: ChannelType;
    workplaceId: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
    membersCount?: number;
}
