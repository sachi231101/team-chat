"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const default_channels_1 = require("./default-channels");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    isConnected = false;
    async onModuleInit() {
        try {
            await this.$connect();
            this.isConnected = true;
            this.logger.log('✅ PostgreSQL database connected successfully via Prisma');
            await this.seedInitialWorkspaceData();
            await this.ensureAiAgentUsers();
            await this.provisionMissingDefaultChannels();
        }
        catch (error) {
            this.isConnected = false;
            this.logger.warn(`⚠️ PostgreSQL connection failed: ${error.message}.`);
        }
    }
    async onModuleDestroy() {
        if (this.isConnected) {
            await this.$disconnect();
        }
    }
    async seedInitialWorkspaceData() {
        try {
            const userCount = await this.user.count();
            if (userCount > 0)
                return;
            this.logger.log('🌱 Seeding initial workspace users, channels, and conversations in PostgreSQL...');
            const usersData = [
                {
                    id: 'usr-dev-rahul',
                    name: 'Rahul Sharma',
                    email: 'rahul.sharma@teamchat.io',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    title: 'Lead Staff Engineer',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Architecting Team Chat 🚀',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-dev-priya',
                    name: 'Priya Patel',
                    email: 'priya.patel@teamchat.io',
                    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                    title: 'Product Design Lead',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Polishing dark mode design system 🎨',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-dev-arjun',
                    name: 'Arjun Mehta',
                    email: 'arjun.mehta@teamchat.io',
                    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    title: 'Principal Backend Architect',
                    status: client_1.UserStatus.BUSY,
                    statusMessage: 'Optimizing Redis PubSub & Prisma queries ⚡',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-dev-sachin',
                    name: 'Sachin Verma',
                    email: 'sachin.verma@teamchat.io',
                    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                    title: 'DevOps & Reliability Lead',
                    status: client_1.UserStatus.AWAY,
                    statusMessage: 'Monitoring deployment pipelines 📊',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-dev-ananya',
                    name: 'Ananya Iyer',
                    email: 'ananya.iyer@teamchat.io',
                    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                    title: 'VP of Product',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Q3 Product Roadmap Sync 🗺️',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-agent-research',
                    name: 'ResearchAgent',
                    email: 'research.agent@teamchat.ai',
                    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
                    title: 'AI Research Assistant',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Ready for deep technical research 🤖',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-agent-meeting',
                    name: 'MeetingAgent',
                    email: 'meeting.agent@teamchat.ai',
                    avatarUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
                    title: 'AI Meeting & Agenda Lead',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Synthesizing action items ⚡',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-agent-support',
                    name: 'SupportAgent',
                    email: 'support.agent@teamchat.ai',
                    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
                    title: 'AI Support & Incident Copilot',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Monitoring system health 🛡️',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-agent-workspace',
                    name: 'WorkspaceAgent',
                    email: 'workspace.agent@teamchat.ai',
                    avatarUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=150&auto=format&fit=crop&q=80',
                    title: 'Personal workspace assistant',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Catch-up, search, and drafts — DM only',
                    workplaceId: 'ws-acme-hq-dev',
                },
                {
                    id: 'usr-agent-task',
                    name: 'TaskCoordinator',
                    email: 'task.coordinator@teamchat.ai',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    title: 'AI Task Coordinator',
                    status: client_1.UserStatus.ONLINE,
                    statusMessage: 'Turning discussions into actionable work 📋',
                    workplaceId: 'ws-acme-hq-dev',
                },
            ];
            for (const u of usersData) {
                await this.user.upsert({
                    where: { id: u.id },
                    create: u,
                    update: {},
                });
            }
            const channelsData = [
                {
                    id: 'chn-general',
                    name: 'general',
                    description: 'Company-wide announcements and discussions.',
                    topic: 'Team Chat V1 release sprint in progress 🎯',
                    type: client_1.ChannelType.PUBLIC,
                    workplaceId: 'ws-acme-hq-dev',
                    createdById: 'usr-dev-rahul',
                },
                {
                    id: 'chn-announcements',
                    name: 'announcements',
                    description: 'Important team announcements and company news',
                    topic: 'Official company updates',
                    type: client_1.ChannelType.PUBLIC,
                    workplaceId: 'ws-acme-hq-dev',
                    createdById: 'usr-dev-rahul',
                },
                {
                    id: 'chn-random',
                    name: 'random',
                    description: 'Watercooler chat, intros, and off-topic conversation',
                    topic: 'Say hello',
                    type: client_1.ChannelType.PUBLIC,
                    workplaceId: 'ws-acme-hq-dev',
                    createdById: 'usr-dev-rahul',
                },
                {
                    id: 'chn-engineering',
                    name: 'engineering',
                    description: 'Technical architecture, code reviews, PRs, and system design discussions',
                    topic: 'Vite 6 + React 19 + Tailwind CSS + NestJS stack alignment',
                    type: client_1.ChannelType.PUBLIC,
                    workplaceId: 'ws-acme-hq-dev',
                    createdById: 'usr-dev-arjun',
                },
                {
                    id: 'chn-design-system',
                    name: 'design-system',
                    description: 'Figma components, color palettes, micro-interactions, and accessibility',
                    topic: 'Tailwind styling tokens & dark/light theme polish ✨',
                    type: client_1.ChannelType.PUBLIC,
                    workplaceId: 'ws-acme-hq-dev',
                    createdById: 'usr-dev-priya',
                },
            ];
            for (const c of channelsData) {
                await this.channel.upsert({
                    where: { id: c.id },
                    create: c,
                    update: {},
                });
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
                            role: u.id === c.createdById ? client_1.ChannelMemberRole.ADMIN : client_1.ChannelMemberRole.MEMBER,
                        },
                        update: {},
                    });
                }
            }
            const convoPriya = await this.conversation.upsert({
                where: { id: 'dm-priya' },
                create: {
                    id: 'dm-priya',
                    workplaceId: 'ws-acme-hq-dev',
                    participants: {
                        create: [{ userId: 'usr-dev-rahul' }, { userId: 'usr-dev-priya' }],
                    },
                },
                update: {},
            });
            const convoArjun = await this.conversation.upsert({
                where: { id: 'dm-arjun' },
                create: {
                    id: 'dm-arjun',
                    workplaceId: 'ws-acme-hq-dev',
                    participants: {
                        create: [{ userId: 'usr-dev-rahul' }, { userId: 'usr-dev-arjun' }],
                    },
                },
                update: {},
            });
            await this.message.createMany({
                data: [
                    {
                        id: 'msg-gen-1',
                        content: 'Welcome everyone to the Team Chat application! 🚀 PostgreSQL persistence and Socket.IO real-time delivery are now active.',
                        senderId: 'usr-dev-rahul',
                        channelId: 'chn-general',
                        pinned: true,
                    },
                    {
                        id: 'msg-gen-2',
                        content: 'The dark mode palette and interface styling look stunning! Excited for the V1 release.',
                        senderId: 'usr-dev-priya',
                        channelId: 'chn-general',
                        pinned: false,
                    },
                ],
            });
            await this.notification.createMany({
                data: [
                    {
                        id: 'notif-1',
                        userId: 'usr-dev-rahul',
                        title: 'Priya Patel mentioned you in #general',
                        body: 'Hey @Rahul, check out the new design system tokens!',
                        type: client_1.NotificationType.MENTION,
                        channelId: 'chn-general',
                        unread: true,
                    },
                    {
                        id: 'notif-2',
                        userId: 'usr-dev-rahul',
                        title: 'Arjun Mehta replied to your thread in #engineering',
                        body: 'Prisma schema and PostgreSQL migrations look solid 👍',
                        type: client_1.NotificationType.REPLY,
                        channelId: 'chn-engineering',
                        unread: false,
                    },
                ],
            });
            this.logger.log('✨ Seeded workspace users, channels, conversations, messages, and notifications in PostgreSQL successfully');
        }
        catch (err) {
            this.logger.warn(`Seed notice: ${err.message}`);
        }
    }
    async ensureAiAgentUsers() {
        const agents = [
            {
                id: 'usr-agent-research',
                name: 'ResearchAgent',
                email: 'research.agent@teamchat.ai',
                avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
                title: 'AI Research Assistant',
                status: client_1.UserStatus.ONLINE,
                statusMessage: 'Ready for deep technical research',
                workplaceId: 'ws-acme-hq-dev',
            },
            {
                id: 'usr-agent-meeting',
                name: 'MeetingAgent',
                email: 'meeting.agent@teamchat.ai',
                avatarUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
                title: 'AI Meeting & Agenda Lead',
                status: client_1.UserStatus.ONLINE,
                statusMessage: 'Synthesizing action items',
                workplaceId: 'ws-acme-hq-dev',
            },
            {
                id: 'usr-agent-support',
                name: 'SupportAgent',
                email: 'support.agent@teamchat.ai',
                avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
                title: 'AI Support & Incident Copilot',
                status: client_1.UserStatus.ONLINE,
                statusMessage: 'Monitoring system health',
                workplaceId: 'ws-acme-hq-dev',
            },
            {
                id: 'usr-agent-workspace',
                name: 'WorkspaceAgent',
                email: 'workspace.agent@teamchat.ai',
                avatarUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=150&auto=format&fit=crop&q=80',
                title: 'Personal workspace assistant',
                status: client_1.UserStatus.ONLINE,
                statusMessage: 'Catch-up, search, and drafts — DM only',
                workplaceId: 'ws-acme-hq-dev',
            },
            {
                id: 'usr-agent-task',
                name: 'TaskCoordinator',
                email: 'task.coordinator@teamchat.ai',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                title: 'AI Task Coordinator',
                status: client_1.UserStatus.ONLINE,
                statusMessage: 'Turning discussions into actionable work',
                workplaceId: 'ws-acme-hq-dev',
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
        }
        catch (err) {
            this.logger.warn(`AI agent upsert notice: ${err.message}`);
        }
    }
    async provisionMissingDefaultChannels() {
        try {
            const workplaceId = 'ws-acme-hq-dev';
            const users = await this.user.findMany({ where: { workplaceId }, orderBy: { createdAt: 'asc' } });
            if (users.length === 0)
                return;
            const missing = [];
            for (const def of default_channels_1.DEFAULT_PUBLIC_CHANNELS) {
                const exists = await this.channel.findFirst({ where: { workplaceId, name: def.name } });
                if (!exists)
                    missing.push(def.name);
            }
            if (missing.length === 0)
                return;
            this.logger.log(`🌱 Creating default channels (${missing.join(', ')}) for existing workspace users`);
            for (const user of users) {
                await (0, default_channels_1.provisionUserPublicChannels)(this, user.id, workplaceId);
            }
        }
        catch (err) {
            this.logger.warn(`Default channel provision notice: ${err.message}`);
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map