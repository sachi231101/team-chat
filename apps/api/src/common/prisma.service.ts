import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, ChannelType, UserStatus, NotificationType, ChannelMemberRole } from '@prisma/client';
import { provisionUserPublicChannels, DEFAULT_PUBLIC_CHANNELS } from './default-channels';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('✅ PostgreSQL database connected successfully via Prisma');
      await this.seedInitialWorkspaceData();
      await this.ensureAiAgentUsers();
      await this.provisionMissingDefaultChannels();
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ PostgreSQL connection failed: ${(error as Error).message}.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }

  private async seedInitialWorkspaceData() {
    try {
      const userCount = await this.user.count();
      if (userCount > 0) return;

      this.logger.log('🌱 Seeding initial workspace users, channels, and conversations in PostgreSQL...');

      // Seed Users
      const usersData = [
        {
          id: 'usr-rahul',
          name: 'Rahul Sharma',
          email: 'rahul.sharma@teamchat.io',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          title: 'Lead Staff Engineer',
          status: UserStatus.ONLINE,
          statusMessage: 'Architecting Team Chat 🚀',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-priya',
          name: 'Priya Patel',
          email: 'priya.patel@teamchat.io',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          title: 'Product Design Lead',
          status: UserStatus.ONLINE,
          statusMessage: 'Polishing dark mode design system 🎨',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-arjun',
          name: 'Arjun Mehta',
          email: 'arjun.mehta@teamchat.io',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          title: 'Principal Backend Architect',
          status: UserStatus.BUSY,
          statusMessage: 'Optimizing Redis PubSub & Prisma queries ⚡',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-sachin',
          name: 'Sachin Verma',
          email: 'sachin.verma@teamchat.io',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          title: 'DevOps & Reliability Lead',
          status: UserStatus.AWAY,
          statusMessage: 'Monitoring deployment pipelines 📊',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-ananya',
          name: 'Ananya Iyer',
          email: 'ananya.iyer@teamchat.io',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          title: 'VP of Product',
          status: UserStatus.ONLINE,
          statusMessage: 'Q3 Product Roadmap Sync 🗺️',
          workplaceId: 'wp-teamchat-main',
        },
        // AI Teammates
        {
          id: 'usr-agent-research',
          name: 'ResearchAgent',
          email: 'research.agent@teamchat.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
          title: 'AI Research Assistant',
          status: UserStatus.ONLINE,
          statusMessage: 'Ready for deep technical research 🤖',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-agent-meeting',
          name: 'MeetingAgent',
          email: 'meeting.agent@teamchat.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
          title: 'AI Meeting & Agenda Lead',
          status: UserStatus.ONLINE,
          statusMessage: 'Synthesizing action items ⚡',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-agent-support',
          name: 'SupportAgent',
          email: 'support.agent@teamchat.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
          title: 'AI Support & Incident Copilot',
          status: UserStatus.ONLINE,
          statusMessage: 'Monitoring system health 🛡️',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-agent-workspace',
          name: 'WorkspaceAgent',
          email: 'workspace.agent@teamchat.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=150&auto=format&fit=crop&q=80',
          title: 'Personal workspace assistant',
          status: UserStatus.ONLINE,
          statusMessage: 'Catch-up, search, and drafts — DM only',
          workplaceId: 'wp-teamchat-main',
        },
        {
          id: 'usr-agent-task',
          name: 'TaskCoordinator',
          email: 'task.coordinator@teamchat.ai',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          title: 'AI Task Coordinator',
          status: UserStatus.ONLINE,
          statusMessage: 'Turning discussions into actionable work 📋',
          workplaceId: 'wp-teamchat-main',
        },
      ];

      for (const u of usersData) {
        await this.user.upsert({
          where: { id: u.id },
          create: u,
          update: {},
        });
      }

      // Seed Channels
      const channelsData = [
        {
          id: 'chn-general',
          name: 'general',
          description: 'Company-wide announcements and discussions.',
          topic: 'Team Chat V1 release sprint in progress 🎯',
          type: ChannelType.PUBLIC,
          workplaceId: 'wp-teamchat-main',
          createdById: 'usr-rahul',
        },
        {
          id: 'chn-announcements',
          name: 'announcements',
          description: 'Important team announcements and company news',
          topic: 'Official company updates',
          type: ChannelType.PUBLIC,
          workplaceId: 'wp-teamchat-main',
          createdById: 'usr-rahul',
        },
        {
          id: 'chn-random',
          name: 'random',
          description: 'Watercooler chat, intros, and off-topic conversation',
          topic: 'Say hello',
          type: ChannelType.PUBLIC,
          workplaceId: 'wp-teamchat-main',
          createdById: 'usr-rahul',
        },
        {
          id: 'chn-engineering',
          name: 'engineering',
          description: 'Technical architecture, code reviews, PRs, and system design discussions',
          topic: 'Vite 6 + React 19 + Tailwind CSS + NestJS stack alignment',
          type: ChannelType.PUBLIC,
          workplaceId: 'wp-teamchat-main',
          createdById: 'usr-arjun',
        },
        {
          id: 'chn-design-system',
          name: 'design-system',
          description: 'Figma components, color palettes, micro-interactions, and accessibility',
          topic: 'Tailwind styling tokens & dark/light theme polish ✨',
          type: ChannelType.PUBLIC,
          workplaceId: 'wp-teamchat-main',
          createdById: 'usr-priya',
        },
      ];

      for (const c of channelsData) {
        await this.channel.upsert({
          where: { id: c.id },
          create: c,
          update: {},
        });

        // Add all users as members of standard channels
        for (const u of usersData) {
          await this.channelMember.upsert({
            where: {
              channelId_userId: {
                channelId: c.id,
                userId: u.id,
              },
            },
            create: {
              channelId: c.id,
              userId: u.id,
              role: u.id === c.createdById ? ChannelMemberRole.ADMIN : ChannelMemberRole.MEMBER,
            },
            update: {},
          });
        }
      }

      // Seed Direct Conversations
      const convoPriya = await this.conversation.upsert({
        where: { id: 'dm-priya' },
        create: {
          id: 'dm-priya',
          workplaceId: 'wp-teamchat-main',
          participants: {
            create: [{ userId: 'usr-rahul' }, { userId: 'usr-priya' }],
          },
        },
        update: {},
      });

      const convoArjun = await this.conversation.upsert({
        where: { id: 'dm-arjun' },
        create: {
          id: 'dm-arjun',
          workplaceId: 'wp-teamchat-main',
          participants: {
            create: [{ userId: 'usr-rahul' }, { userId: 'usr-arjun' }],
          },
        },
        update: {},
      });

      // Seed Initial Messages in #general
      await this.message.createMany({
        data: [
          {
            id: 'msg-gen-1',
            content: 'Welcome everyone to the Team Chat application! 🚀 PostgreSQL persistence and Socket.IO real-time delivery are now active.',
            senderId: 'usr-rahul',
            channelId: 'chn-general',
            pinned: true,
          },
          {
            id: 'msg-gen-2',
            content: 'The dark mode palette and interface styling look stunning! Excited for the V1 release.',
            senderId: 'usr-priya',
            channelId: 'chn-general',
            pinned: false,
          },
        ],
      });

      // Seed Initial Notifications
      await this.notification.createMany({
        data: [
          {
            id: 'notif-1',
            userId: 'usr-rahul',
            title: 'Priya Patel mentioned you in #general',
            body: 'Hey @Rahul, check out the new design system tokens!',
            type: NotificationType.MENTION,
            channelId: 'chn-general',
            unread: true,
          },
          {
            id: 'notif-2',
            userId: 'usr-rahul',
            title: 'Arjun Mehta replied to your thread in #engineering',
            body: 'Prisma schema and PostgreSQL migrations look solid 👍',
            type: NotificationType.REPLY,
            channelId: 'chn-engineering',
            unread: false,
          },
        ],
      });

      this.logger.log('✨ Seeded workspace users, channels, conversations, messages, and notifications in PostgreSQL successfully');
    } catch (err) {
      this.logger.warn(`Seed notice: ${(err as Error).message}`);
    }
  }

  /** Agents must exist even if the DB was seeded before they were added. */
  private async ensureAiAgentUsers() {
    const agents = [
      {
        id: 'usr-agent-research',
        name: 'ResearchAgent',
        email: 'research.agent@teamchat.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        title: 'AI Research Assistant',
        status: UserStatus.ONLINE,
        statusMessage: 'Ready for deep technical research',
        workplaceId: 'wp-teamchat-main',
      },
      {
        id: 'usr-agent-meeting',
        name: 'MeetingAgent',
        email: 'meeting.agent@teamchat.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
        title: 'AI Meeting & Agenda Lead',
        status: UserStatus.ONLINE,
        statusMessage: 'Synthesizing action items',
        workplaceId: 'wp-teamchat-main',
      },
      {
        id: 'usr-agent-support',
        name: 'SupportAgent',
        email: 'support.agent@teamchat.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        title: 'AI Support & Incident Copilot',
        status: UserStatus.ONLINE,
        statusMessage: 'Monitoring system health',
        workplaceId: 'wp-teamchat-main',
      },
      {
        id: 'usr-agent-workspace',
        name: 'WorkspaceAgent',
        email: 'workspace.agent@teamchat.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=150&auto=format&fit=crop&q=80',
        title: 'Personal workspace assistant',
        status: UserStatus.ONLINE,
        statusMessage: 'Catch-up, search, and drafts — DM only',
        workplaceId: 'wp-teamchat-main',
      },
      {
        id: 'usr-agent-task',
        name: 'TaskCoordinator',
        email: 'task.coordinator@teamchat.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        title: 'AI Task Coordinator',
        status: UserStatus.ONLINE,
        statusMessage: 'Turning discussions into actionable work',
        workplaceId: 'wp-teamchat-main',
      },
    ];

    try {
      for (const agent of agents) {
        await this.user.upsert({
          where: { id: agent.id },
          create: agent,
          update: {
            name: agent.name,
            title: agent.title,
            statusMessage: agent.statusMessage,
            status: agent.status,
          },
        });
      }
    } catch (err) {
      this.logger.warn(`AI agent upsert notice: ${(err as Error).message}`);
    }
  }

  /** If the workspace already has users but is missing #general / #random / #announcements, create them. */
  private async provisionMissingDefaultChannels() {
    try {
      const workplaceId = 'wp-teamchat-main';
      const users = await this.user.findMany({ where: { workplaceId }, orderBy: { createdAt: 'asc' } });
      if (users.length === 0) return;

      const missing: string[] = [];
      for (const def of DEFAULT_PUBLIC_CHANNELS) {
        const exists = await this.channel.findFirst({ where: { workplaceId, name: def.name } });
        if (!exists) missing.push(def.name);
      }
      if (missing.length === 0) return;

      this.logger.log(`🌱 Creating default channels (${missing.join(', ')}) for existing workspace users`);
      for (const user of users) {
        await provisionUserPublicChannels(this, user.id, workplaceId);
      }
    } catch (err) {
      this.logger.warn(`Default channel provision notice: ${(err as Error).message}`);
    }
  }
}
