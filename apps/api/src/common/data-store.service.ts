import { Injectable } from '@nestjs/common';
import {
  Channel,
  Conversation,
  Message,
  User,
  NotificationItem,
} from '@team-chat/shared';

@Injectable()
export class DataStoreService {
  private users: User[] = [
    {
      id: 'usr-rahul',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@teamchat.io',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Lead Staff Engineer',
      status: 'online',
      statusMessage: 'Architecting Team Chat 🚀',
      workplaceId: 'wp-teamchat-main',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr-priya',
      name: 'Priya Patel',
      email: 'priya.patel@teamchat.io',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      title: 'Product Design Lead',
      status: 'online',
      statusMessage: 'Polishing dark mode design system 🎨',
      workplaceId: 'wp-teamchat-main',
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'usr-arjun',
      name: 'Arjun Mehta',
      email: 'arjun.mehta@teamchat.io',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Principal Backend Architect',
      status: 'busy',
      statusMessage: 'Optimizing Redis PubSub & Prisma queries ⚡',
      workplaceId: 'wp-teamchat-main',
      createdAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: 'usr-sachin',
      name: 'Sachin Verma',
      email: 'sachin.verma@teamchat.io',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'DevOps & Reliability Lead',
      status: 'away',
      statusMessage: 'Monitoring deployment pipelines 📊',
      workplaceId: 'wp-teamchat-main',
      createdAt: '2026-01-04T00:00:00.000Z',
    },
    {
      id: 'usr-ananya',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@teamchat.io',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product',
      status: 'online',
      statusMessage: 'Q3 Product Roadmap Sync 🗺️',
      workplaceId: 'wp-teamchat-main',
      createdAt: '2026-01-05T00:00:00.000Z',
    },
  ];

  private channels: Channel[] = [
    {
      id: 'chn-general',
      name: 'general',
      description: 'Company-wide announcements and discussions.',
      topic: 'Team Chat V1 release sprint in progress 🎯',
      type: 'public',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-rahul',
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
      unreadCount: 1,
      membersCount: 24,
    },
    {
      id: 'chn-announcements',
      name: 'announcements',
      description: 'Important team announcements and company news',
      topic: 'Official company updates',
      type: 'public',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-rahul',
      createdAt: '2026-01-01T08:15:00.000Z',
      updatedAt: '2026-01-01T08:15:00.000Z',
      unreadCount: 0,
      membersCount: 24,
    },
    {
      id: 'chn-engineering',
      name: 'engineering',
      description:
        'Technical architecture, code reviews, PRs, and system design discussions',
      topic: 'Vite 6 + React 19 + Tailwind CSS + NestJS stack alignment',
      type: 'public',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-arjun',
      createdAt: '2026-01-01T08:30:00.000Z',
      updatedAt: '2026-01-01T08:30:00.000Z',
      unreadCount: 4,
      membersCount: 24,
    },
    {
      id: 'chn-sales',
      name: 'sales',
      description:
        'Sales pipeline, prospective clients, demo feedback, and customer deals',
      topic: 'Enterprise Q3 outbound targets & inbound leads review',
      type: 'public',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-ananya',
      createdAt: '2026-01-02T09:00:00.000Z',
      updatedAt: '2026-01-02T09:00:00.000Z',
      unreadCount: 0,
      membersCount: 19,
    },
    {
      id: 'chn-marketing',
      name: 'marketing',
      description:
        'Campaigns, brand collateral, product announcements, and social content',
      topic: 'Product #1 Launch Strategy & Press Release Draft',
      type: 'public',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-priya',
      createdAt: '2026-01-02T09:30:00.000Z',
      updatedAt: '2026-01-02T09:30:00.000Z',
      unreadCount: 2,
      membersCount: 15,
    },
    {
      id: 'chn-design-system',
      name: 'design-system',
      description:
        'Figma components, color palettes, micro-interactions, and accessibility',
      topic: 'Tailwind styling tokens & dark/light theme polish ✨',
      type: 'public',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-priya',
      createdAt: '2026-01-03T10:00:00.000Z',
      updatedAt: '2026-01-03T10:00:00.000Z',
      unreadCount: 0,
      membersCount: 12,
    },
    {
      id: 'chn-leadership-private',
      name: 'leadership-private',
      description:
        'Executive strategy, quarterly milestones, and leadership alignment',
      topic: 'Confidential strategic planning',
      type: 'private',
      workplaceId: 'wp-teamchat-main',
      createdById: 'usr-rahul',
      createdAt: '2026-01-03T11:00:00.000Z',
      updatedAt: '2026-01-03T11:00:00.000Z',
      unreadCount: 0,
      membersCount: 5,
    },
  ];

  private conversations: Conversation[] = [
    {
      id: 'dm-priya',
      participants: ['usr-rahul', 'usr-priya'],
      workplaceId: 'wp-teamchat-main',
      unreadCount: 1,
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-04T14:20:00.000Z',
    },
    {
      id: 'dm-arjun',
      participants: ['usr-rahul', 'usr-arjun'],
      workplaceId: 'wp-teamchat-main',
      unreadCount: 0,
      createdAt: '2026-01-01T10:30:00.000Z',
      updatedAt: '2026-01-04T13:45:00.000Z',
    },
    {
      id: 'dm-sachin',
      participants: ['usr-rahul', 'usr-sachin'],
      workplaceId: 'wp-teamchat-main',
      unreadCount: 0,
      createdAt: '2026-01-02T11:00:00.000Z',
      updatedAt: '2026-01-03T16:10:00.000Z',
    },
    {
      id: 'dm-ananya',
      participants: ['usr-rahul', 'usr-ananya'],
      workplaceId: 'wp-teamchat-main',
      unreadCount: 0,
      createdAt: '2026-01-03T09:00:00.000Z',
      updatedAt: '2026-01-04T11:20:00.000Z',
    },
  ];

  private messages: Message[] = [
    {
      id: 'msg-gen-1',
      channelId: 'chn-general',
      senderId: 'usr-rahul',
      senderName: 'Rahul Sharma',
      senderAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content:
        '🚀 Welcome everyone to **Team Chat V1**! We are building a high-performance, modular messaging application.\n\nLet’s ensure all discussions remain focused, clean, and collaborative.',
      pinned: true,
      reactions: [
        {
          id: 'r1',
          emoji: '👍',
          userId: 'usr-priya',
          userName: 'Priya Patel',
          createdAt: '2026-01-04T09:05:00.000Z',
        },
        {
          id: 'r2',
          emoji: '❤️',
          userId: 'usr-arjun',
          userName: 'Arjun Mehta',
          createdAt: '2026-01-04T09:06:00.000Z',
        },
        {
          id: 'r3',
          emoji: '🎉',
          userId: 'usr-sachin',
          userName: 'Sachin Verma',
          createdAt: '2026-01-04T09:10:00.000Z',
        },
        {
          id: 'r4',
          emoji: '🔥',
          userId: 'usr-ananya',
          userName: 'Ananya Iyer',
          createdAt: '2026-01-04T09:12:00.000Z',
        },
      ],
      replyCount: 3,
      lastReplyAt: '2026-01-04T09:45:00.000Z',
      createdAt: '2026-01-04T02:30:00.000Z',
      updatedAt: '2026-01-04T02:30:00.000Z',
    },
    {
      id: 'msg-gen-2',
      channelId: 'chn-general',
      senderId: 'usr-priya',
      senderName: 'Priya Patel',
      senderAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content:
        'Good morning team! ☀️ I’ve finalized the design tokens and dark mode palette. Here is the updated design spec preview for the message timeline & reactions bar.',
      attachments: [
        {
          id: 'att-1',
          name: 'design-system-v2.png',
          size: 1024 * 1024 * 1.8,
          type: 'image/png',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          previewUrl:
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          createdAt: '2026-01-04T02:45:00.000Z',
        },
      ],
      reactions: [
        {
          id: 'r5',
          emoji: '👍',
          userId: 'usr-rahul',
          userName: 'Rahul Sharma',
          createdAt: '2026-01-04T09:20:00.000Z',
        },
        {
          id: 'r6',
          emoji: '👏',
          userId: 'usr-kavita',
          userName: 'Kavita Rao',
          createdAt: '2026-01-04T09:25:00.000Z',
        },
      ],
      replyCount: 0,
      createdAt: '2026-01-04T02:45:00.000Z',
      updatedAt: '2026-01-04T02:45:00.000Z',
    },
    {
      id: 'msg-gen-3',
      channelId: 'chn-general',
      senderId: 'usr-arjun',
      senderName: 'Arjun Mehta',
      senderAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content: 'Looks amazing! The gradients and shadows are on point. 🔥',
      reactions: [
        {
          id: 'r7',
          emoji: '🎉',
          userId: 'usr-rahul',
          userName: 'Rahul Sharma',
          createdAt: '2026-01-04T09:35:00.000Z',
        },
      ],
      replyCount: 0,
      createdAt: '2026-01-04T03:10:00.000Z',
      updatedAt: '2026-01-04T03:10:00.000Z',
    },
    {
      id: 'msg-thr-1',
      channelId: 'chn-general',
      parentMessageId: 'msg-gen-1',
      senderId: 'usr-priya',
      senderName: 'Priya Patel',
      senderAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content:
        'Super thrilled for this milestone! The React + Tailwind frontend is coming together nicely.',
      reactions: [
        {
          id: 'r10',
          emoji: '🎉',
          userId: 'usr-rahul',
          userName: 'Rahul Sharma',
          createdAt: '2026-01-04T09:10:00.000Z',
        },
      ],
      createdAt: '2026-01-04T09:08:00.000Z',
      updatedAt: '2026-01-04T09:08:00.000Z',
    },
    {
      id: 'msg-thr-2',
      channelId: 'chn-general',
      parentMessageId: 'msg-gen-1',
      senderId: 'usr-arjun',
      senderName: 'Arjun Mehta',
      senderAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content:
        'Backend modules for chat, presence, notifications, and realtime are in place.',
      reactions: [],
      createdAt: '2026-01-04T09:15:00.000Z',
      updatedAt: '2026-01-04T09:15:00.000Z',
    },
    {
      id: 'msg-thr-3',
      channelId: 'chn-general',
      parentMessageId: 'msg-gen-1',
      senderId: 'usr-sachin',
      senderName: 'Sachin Verma',
      senderAvatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      content: 'Awesome work everyone! Let’s keep pushing forward.',
      reactions: [],
      createdAt: '2026-01-04T09:20:00.000Z',
      updatedAt: '2026-01-04T09:20:00.000Z',
    },
    {
      id: 'msg-eng-1',
      channelId: 'chn-engineering',
      senderId: 'usr-arjun',
      senderName: 'Arjun Mehta',
      senderAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content:
        'Updated the API schemas for channel conversations. Please check packages/shared/src/types/chat.ts for the latest model signatures.',
      reactions: [
        {
          id: 'r11',
          emoji: '👍',
          userId: 'usr-sachin',
          userName: 'Sachin Verma',
          createdAt: '2026-01-04T10:00:00.000Z',
        },
      ],
      createdAt: '2026-01-04T09:50:00.000Z',
      updatedAt: '2026-01-04T09:50:00.000Z',
    },
  ];

  private notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'Priya Patel mentioned you',
      body: 'in #general: "Welcome everyone to Team Chat V1!"',
      time: '10m ago',
      unread: true,
      type: 'mention',
      channelId: 'chn-general',
    },
    {
      id: 'notif-2',
      title: 'Arjun Mehta replied to thread',
      body: 'in #general: "Backend modules for chat, presence, realtime..."',
      time: '35m ago',
      unread: true,
      type: 'reply',
      channelId: 'chn-general',
    },
  ];

  // Users
  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  updateUserStatus(
    id: string,
    status: 'online' | 'busy' | 'away' | 'offline',
    statusMessage?: string,
  ): User | undefined {
    const user = this.getUserById(id);
    if (user) {
      user.status = status;
      if (statusMessage !== undefined) user.statusMessage = statusMessage;
    }
    return user;
  }

  // Channels
  getChannels(): Channel[] {
    return this.channels;
  }

  getChannelById(id: string): Channel | undefined {
    return this.channels.find((c) => c.id === id);
  }

  createChannel(
    channel: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'membersCount'>,
  ): Channel {
    const id = `chn-${channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newChannel: Channel = {
      ...channel,
      id,
      membersCount: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.channels.push(newChannel);
    return newChannel;
  }

  // Conversations
  getConversations(): Conversation[] {
    return this.conversations;
  }

  getConversationById(id: string): Conversation | undefined {
    return this.conversations.find((c) => c.id === id);
  }

  createConversation(
    participants: string[],
    workplaceId: string = 'wp-teamchat-main',
  ): Conversation {
    const existing = this.conversations.find(
      (c) =>
        c.participants.length === participants.length &&
        participants.every((p) => c.participants.includes(p)),
    );
    if (existing) return existing;

    const newConvo: Conversation = {
      id: `dm-${Date.now().toString().slice(-6)}`,
      participants,
      workplaceId,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.conversations.push(newConvo);
    return newConvo;
  }

  // Messages
  getMessages(channelId?: string, conversationId?: string): Message[] {
    if (channelId)
      return this.messages.filter((m) => m.channelId === channelId);
    if (conversationId)
      return this.messages.filter((m) => m.conversationId === conversationId);
    return this.messages;
  }

  getMessageById(id: string): Message | undefined {
    return this.messages.find((m) => m.id === id);
  }

  createMessage(
    data: Partial<Message> & {
      content: string;
      senderId: string;
      senderName: string;
    },
  ): Message {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content: data.content,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar:
        data.senderAvatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      channelId: data.channelId,
      conversationId: data.conversationId,
      parentMessageId: data.parentMessageId,
      pinned: false,
      reactions: [],
      attachments: data.attachments || [],
      replyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (data.parentMessageId) {
      const parent = this.getMessageById(data.parentMessageId);
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
        parent.lastReplyAt = newMessage.createdAt;
      }
    }

    this.messages.push(newMessage);
    return newMessage;
  }

  editMessage(id: string, newContent: string): Message | undefined {
    const msg = this.getMessageById(id);
    if (msg) {
      msg.content = newContent;
      msg.editedAt = new Date().toISOString();
      msg.updatedAt = new Date().toISOString();
    }
    return msg;
  }

  deleteMessage(id: string): boolean {
    const initialLen = this.messages.length;
    this.messages = this.messages.filter(
      (m) => m.id !== id && m.parentMessageId !== id,
    );
    return this.messages.length < initialLen;
  }

  togglePin(id: string): Message | undefined {
    const msg = this.getMessageById(id);
    if (msg) {
      msg.pinned = !msg.pinned;
    }
    return msg;
  }

  toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
    userName: string,
  ): Message | undefined {
    const msg = this.getMessageById(messageId);
    if (!msg) return undefined;

    const existingIdx = msg.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId === userId,
    );
    if (existingIdx >= 0) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      msg.reactions.push({
        id: `r-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
        emoji,
        userId,
        userName,
        createdAt: new Date().toISOString(),
      });
    }
    return msg;
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  markNotificationAsRead(id: string): void {
    const n = this.notifications.find((item) => item.id === id);
    if (n) n.unread = false;
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach((n) => (n.unread = false));
  }

  // Search
  search(query: string) {
    const q = query.toLowerCase();
    const matchedMessages = this.messages.filter((m) =>
      m.content.toLowerCase().includes(q),
    );
    const matchedChannels = this.channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
    const matchedUsers = this.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
    return {
      messages: matchedMessages,
      channels: matchedChannels,
      users: matchedUsers,
    };
  }

  // Channel Members
  private channelMembers: Record<string, string[]> = {
    'chn-general': ['usr-rahul', 'usr-priya', 'usr-arjun', 'usr-sachin', 'usr-ananya'],
    'chn-announcements': ['usr-rahul', 'usr-priya', 'usr-arjun', 'usr-sachin', 'usr-ananya'],
    'chn-engineering': ['usr-rahul', 'usr-priya', 'usr-arjun', 'usr-sachin', 'usr-ananya'],
    'chn-sales': ['usr-rahul', 'usr-priya', 'usr-sachin'],
    'chn-marketing': ['usr-rahul', 'usr-priya', 'usr-ananya'],
    'chn-design-system': ['usr-rahul', 'usr-priya', 'usr-ananya'],
    'chn-leadership-private': ['usr-rahul', 'usr-ananya'],
  };

  getChannelMembers(channelId: string): User[] {
    const memberIds = this.channelMembers[channelId] || [];
    return this.users.filter((u) => memberIds.includes(u.id));
  }

  addChannelMembers(channelId: string, userIds: string[]): User[] {
    if (!this.channelMembers[channelId]) {
      this.channelMembers[channelId] = [];
    }
    for (const uid of userIds) {
      if (!this.channelMembers[channelId].includes(uid)) {
        this.channelMembers[channelId].push(uid);
      }
    }
    const ch = this.getChannelById(channelId);
    if (ch) {
      ch.membersCount = this.channelMembers[channelId].length;
    }
    return this.getChannelMembers(channelId);
  }

  removeChannelMember(channelId: string, userId: string): boolean {
    if (!this.channelMembers[channelId]) return false;
    this.channelMembers[channelId] = this.channelMembers[channelId].filter((id) => id !== userId);
    const ch = this.getChannelById(channelId);
    if (ch) {
      ch.membersCount = this.channelMembers[channelId].length;
    }
    return true;
  }

  isChannelMember(channelId: string, userId: string): boolean {
    const ch = this.getChannelById(channelId);
    if (!ch) return false;
    if (ch.type === 'public') return true;
    const members = this.channelMembers[channelId] || [];
    return members.includes(userId);
  }
}

