import { Channel, Conversation, Message, User, NotificationItem } from '@team-chat/shared';
export declare class DataStoreService {
    private users;
    private channels;
    private conversations;
    private messages;
    private notifications;
    getUsers(): User[];
    getUserById(id: string): User | undefined;
    updateUserStatus(id: string, status: 'online' | 'busy' | 'away' | 'offline', statusMessage?: string): User | undefined;
    getChannels(): Channel[];
    getChannelById(id: string): Channel | undefined;
    createChannel(channel: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'membersCount'>): Channel;
    getConversations(): Conversation[];
    getConversationById(id: string): Conversation | undefined;
    createConversation(participants: string[], workplaceId?: string): Conversation;
    getMessages(channelId?: string, conversationId?: string): Message[];
    getMessageById(id: string): Message | undefined;
    createMessage(data: Partial<Message> & {
        content: string;
        senderId: string;
        senderName: string;
    }): Message;
    editMessage(id: string, newContent: string): Message | undefined;
    deleteMessage(id: string): boolean;
    togglePin(id: string): Message | undefined;
    toggleReaction(messageId: string, emoji: string, userId: string, userName: string): Message | undefined;
    getNotifications(): NotificationItem[];
    markNotificationAsRead(id: string): void;
    markAllNotificationsAsRead(): void;
    search(query: string): {
        messages: Message[];
        channels: Channel[];
        users: User[];
    };
    private channelMembers;
    getChannelMembers(channelId: string): User[];
    addChannelMembers(channelId: string, userIds: string[]): User[];
    removeChannelMember(channelId: string, userId: string): boolean;
    isChannelMember(channelId: string, userId: string): boolean;
}
