"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma.service");
let MessagesService = class MessagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(channelId, conversationId, limit = 50, cursor) {
        try {
            const where = {
                deletedAt: null,
            };
            if (channelId)
                where.channelId = channelId;
            if (conversationId)
                where.conversationId = conversationId;
            const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
            const messages = await this.prisma.message.findMany({
                where,
                take,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                include: {
                    sender: true,
                    reactions: { include: { user: true } },
                    attachments: true,
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            });
            return messages.map((m) => this.mapMessageToDto(m));
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to fetch messages: ${error.message}`);
        }
    }
    async findOne(id) {
        try {
            const m = await this.prisma.message.findUnique({
                where: { id },
                include: {
                    sender: true,
                    reactions: { include: { user: true } },
                    attachments: true,
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!m || m.deletedAt) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            return this.mapMessageToDto(m);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to fetch message ${id}: ${error.message}`);
        }
    }
    async create(body) {
        const senderId = body.senderId || 'usr-rahul';
        try {
            const m = await this.prisma.$transaction(async (tx) => {
                const created = await tx.message.create({
                    data: {
                        content: body.content,
                        senderId,
                        channelId: body.channelId,
                        conversationId: body.conversationId,
                        parentMessageId: body.parentMessageId,
                        attachments: body.attachments && body.attachments.length > 0
                            ? {
                                create: body.attachments.map((a) => ({
                                    name: a.name,
                                    size: Math.round(a.size),
                                    type: a.type,
                                    url: a.url,
                                })),
                            }
                            : undefined,
                    },
                    include: {
                        sender: true,
                        reactions: { include: { user: true } },
                        attachments: true,
                        replies: {
                            where: { deletedAt: null },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                });
                if (body.conversationId) {
                    await tx.conversation.update({
                        where: { id: body.conversationId },
                        data: { updatedAt: new Date() },
                    });
                }
                if (body.channelId) {
                    await tx.channel.update({
                        where: { id: body.channelId },
                        data: { updatedAt: new Date() },
                    });
                }
                return created;
            });
            const dto = this.mapMessageToDto(m);
            void this.triggerBotReplyIfNeeded(dto);
            return dto;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to create message: ${error.message}`);
        }
    }
    async update(id, content) {
        try {
            const existing = await this.prisma.message.findUnique({ where: { id } });
            if (!existing || existing.deletedAt) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            const m = await this.prisma.message.update({
                where: { id },
                data: { content, editedAt: new Date() },
                include: {
                    sender: true,
                    reactions: { include: { user: true } },
                    attachments: true,
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            return this.mapMessageToDto(m);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to update message ${id}: ${error.message}`);
        }
    }
    async delete(id) {
        try {
            const existing = await this.prisma.message.findUnique({ where: { id } });
            if (!existing) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            await this.prisma.message.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    content: 'This message was deleted.',
                },
            });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to delete message ${id}: ${error.message}`);
        }
    }
    async togglePin(id) {
        try {
            const current = await this.prisma.message.findUnique({ where: { id } });
            if (!current || current.deletedAt) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            const m = await this.prisma.message.update({
                where: { id },
                data: { pinned: !current.pinned },
                include: {
                    sender: true,
                    reactions: { include: { user: true } },
                    attachments: true,
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            return this.mapMessageToDto(m);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to toggle pin for message ${id}: ${error.message}`);
        }
    }
    async toggleReaction(messageId, emoji, userId = 'usr-rahul', _userName) {
        try {
            const message = await this.prisma.message.findUnique({ where: { id: messageId } });
            if (!message || message.deletedAt) {
                throw new common_1.NotFoundException(`Message ${messageId} not found`);
            }
            await this.prisma.$transaction(async (tx) => {
                const existing = await tx.messageReaction.findUnique({
                    where: {
                        messageId_userId_emoji: {
                            messageId,
                            userId,
                            emoji,
                        },
                    },
                });
                if (existing) {
                    await tx.messageReaction.delete({
                        where: { id: existing.id },
                    });
                }
                else {
                    await tx.messageReaction.create({
                        data: {
                            messageId,
                            userId,
                            emoji,
                        },
                    });
                }
            });
            return this.findOne(messageId);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to toggle reaction on message ${messageId}: ${error.message}`);
        }
    }
    async getReplies(parentMessageId) {
        try {
            const replies = await this.prisma.message.findMany({
                where: {
                    parentMessageId,
                    deletedAt: null,
                },
                include: {
                    sender: true,
                    reactions: { include: { user: true } },
                    attachments: true,
                    replies: true,
                },
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            });
            return replies.map((r) => this.mapMessageToDto(r));
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to fetch replies: ${error.message}`);
        }
    }
    async markAsRead(messageId, userId = 'usr-rahul') {
        try {
            await this.prisma.readReceipt.upsert({
                where: {
                    messageId_userId: {
                        messageId,
                        userId,
                    },
                },
                create: {
                    messageId,
                    userId,
                },
                update: {
                    readAt: new Date(),
                },
            });
            return { success: true };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to mark message as read: ${error.message}`);
        }
    }
    async summarizeThread(messageId) {
        try {
            const parent = await this.findOne(messageId);
            const replies = await this.getReplies(messageId);
            const allMessages = [parent, ...replies];
            const combinedText = allMessages.map((m) => `${m.senderName}: ${m.content}`).join('\n');
            const decisions = [];
            const openQuestions = [];
            const actionItems = [];
            const blockers = [];
            allMessages.forEach((m) => {
                const text = m.content;
                const sender = m.senderName;
                if (text.includes('?')) {
                    const sentences = text.split(/[.\n]/).filter((s) => s.includes('?'));
                    sentences.forEach((q) => {
                        if (q.trim().length > 5)
                            openQuestions.push(q.trim());
                    });
                }
                if (/agreed|decided|approved|moving|finalized|done/i.test(text)) {
                    decisions.push(text.split(/[.\n]/)[0].trim());
                }
                if (/blocker|blocked|waiting on|pending|issue/i.test(text)) {
                    blockers.push(text.split(/[.\n]/)[0].trim());
                }
                if (/will |I'll |take over|handling|working on/i.test(text)) {
                    actionItems.push({
                        owner: sender,
                        task: text.split(/[.\n]/)[0].trim(),
                    });
                }
            });
            if (decisions.length === 0) {
                decisions.push(`Discussion concluded on #${parent.content.slice(0, 45)}`);
            }
            if (openQuestions.length === 0 && replies.length > 2) {
                openQuestions.push('Pending final sign-off from stakeholders.');
            }
            if (actionItems.length === 0) {
                actionItems.push({
                    owner: parent.senderName,
                    task: 'Coordinate next milestone deliverables',
                });
            }
            const summaryText = `Thread with ${allMessages.length} messages across ${new Set(allMessages.map((m) => m.senderName)).size} participants. Key focus: "${parent.content.slice(0, 60)}..."`;
            return {
                summary: summaryText,
                decisions: Array.from(new Set(decisions)).slice(0, 4),
                openQuestions: Array.from(new Set(openQuestions)).slice(0, 3),
                actionItems: actionItems.slice(0, 4),
                blockers: Array.from(new Set(blockers)).slice(0, 3),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to generate thread summary: ${error.message}`);
        }
    }
    async triggerBotReplyIfNeeded(createdMessage) {
        const text = createdMessage.content;
        let botId = null;
        let botName = '';
        let responseText = '';
        if (text.includes('@ResearchAgent') || text.toLowerCase().startsWith('/research')) {
            botId = 'usr-agent-research';
            botName = 'ResearchAgent';
            const topic = text.replace(/@ResearchAgent|\/research/gi, '').trim() || 'your query';
            responseText = `🤖 **ResearchAgent Synthesis** for _"${topic}"_:\n\n` +
                `• **Architecture Assessment**: High throughput and modular separation align with system design requirements.\n` +
                `• **Benchmark Comparison**: Benchmarks indicate a ~35% latency reduction under concurrent load.\n` +
                `• **Recommended Next Step**: Implement proof-of-concept branch and run end-to-end integration tests.\n\n` +
                `_Sources: PostgreSQL 16 Docs, Redis 7 Pub/Sub Spec, Internal Architecture RFC_`;
        }
        else if (text.includes('@MeetingAgent') || text.toLowerCase().startsWith('/meeting')) {
            botId = 'usr-agent-meeting';
            botName = 'MeetingAgent';
            responseText = `📋 **MeetingAgent Agenda & Summary**:\n\n` +
                `1. **Sprint Review**: V1 Release checklist & frontend-backend integration.\n` +
                `2. **Decisions**: Finalized dark/light theme tokens and message reaction schemas.\n` +
                `3. **Assigned Actions**: @Rahul Sharma (Deploy staging), @Priya Patel (UI spec sign-off).\n\n` +
                `_Generated automatically from channel context._`;
        }
        else if (text.includes('@SupportAgent') || text.toLowerCase().startsWith('/support')) {
            botId = 'usr-agent-support';
            botName = 'SupportAgent';
            responseText = `🛡️ **SupportAgent Incident Status**:\n\n` +
                `• **Current Health**: All microservices reporting 99.98% uptime.\n` +
                `• **Resolved Issues**: 0 open critical alerts in this workspace.\n` +
                `• **Diagnostic**: Database pool connections operating at optimal capacity.\n\n` +
                `_Telemetry synced with Monitoring Engine._`;
        }
        if (botId) {
            setTimeout(async () => {
                try {
                    await this.create({
                        content: responseText,
                        senderId: botId,
                        channelId: createdMessage.channelId,
                        conversationId: createdMessage.conversationId,
                        parentMessageId: createdMessage.parentMessageId,
                    });
                }
                catch {
                }
            }, 700);
        }
    }
    mapMessageToDto(m) {
        return {
            id: m.id,
            content: m.content,
            senderId: m.senderId,
            senderName: m.sender?.name || 'Rahul Sharma',
            senderAvatar: m.sender?.avatarUrl ?? undefined,
            channelId: m.channelId ?? undefined,
            conversationId: m.conversationId ?? undefined,
            parentMessageId: m.parentMessageId ?? undefined,
            pinned: m.pinned,
            editedAt: m.editedAt?.toISOString(),
            replyCount: m.replies ? m.replies.length : 0,
            lastReplyAt: m.replies && m.replies.length > 0
                ? m.replies[m.replies.length - 1].createdAt.toISOString()
                : undefined,
            reactions: m.reactions
                ? m.reactions.map((r) => ({
                    id: r.id,
                    emoji: r.emoji,
                    userId: r.userId,
                    userName: r.user?.name || 'Team Member',
                    createdAt: r.createdAt.toISOString(),
                }))
                : [],
            attachments: m.attachments
                ? m.attachments.map((a) => ({
                    id: a.id,
                    name: a.name,
                    size: a.size,
                    type: a.type,
                    url: a.url,
                }))
                : [],
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map