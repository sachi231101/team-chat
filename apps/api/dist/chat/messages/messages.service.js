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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma.service");
const chat_access_service_1 = require("../../common/chat-access.service");
const safe_internal_error_1 = require("../../common/safe-internal-error");
const request_user_1 = require("../../common/request-user");
const realtime_service_1 = require("../../realtime/realtime.service");
const mentions_service_1 = require("../mentions/mentions.service");
const ai_orchestrator_service_1 = require("../../ai/ai-orchestrator.service");
const MESSAGE_INCLUDE = {
    sender: true,
    reactions: { include: { user: true } },
    attachments: true,
    tags: { include: { user: true } },
    actionItems: { include: { assignee: true, creator: true } },
    poll: {
        include: {
            creator: true,
            votes: {
                include: {
                    user: true,
                },
            },
        },
    },
    replies: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
    },
};
let MessagesService = MessagesService_1 = class MessagesService {
    prisma;
    chatAccess;
    realtime;
    mentions;
    ai;
    logger = new common_1.Logger(MessagesService_1.name);
    scheduleTimer = null;
    constructor(prisma, chatAccess, realtime, mentions, ai) {
        this.prisma = prisma;
        this.chatAccess = chatAccess;
        this.realtime = realtime;
        this.mentions = mentions;
        this.ai = ai;
    }
    onModuleInit() {
        this.scheduleTimer = setInterval(() => {
            void this.publishDueScheduledMessages().catch((err) => this.logger.warn(`Scheduled message publish failed: ${err.message}`));
        }, 20_000);
    }
    onModuleDestroy() {
        if (this.scheduleTimer)
            clearInterval(this.scheduleTimer);
    }
    visibleMessageFilter() {
        return { scheduledFor: null };
    }
    extractUser(userOrId) {
        if (typeof userOrId === 'string') {
            return { userId: userOrId, workplaceId: request_user_1.DEFAULT_WORKPLACE_ID };
        }
        const userId = ('userId' in userOrId && userOrId.userId) || ('id' in userOrId && userOrId.id) || '';
        const workplaceId = userOrId.workplaceId || request_user_1.DEFAULT_WORKPLACE_ID;
        return { userId, workplaceId };
    }
    async findAll(userOrId, channelId, conversationId, limit = 50, cursor) {
        const user = this.extractUser(userOrId);
        if (!channelId && !conversationId) {
            throw new common_1.BadRequestException('channelId or conversationId is required');
        }
        try {
            if (channelId) {
                await this.chatAccess.assertChannelAccess(user, channelId);
            }
            if (conversationId) {
                await this.chatAccess.assertConversationAccess(user, conversationId);
            }
            const where = {
                deletedAt: null,
                parentMessageId: null,
                ...this.visibleMessageFilter(),
            };
            if (channelId)
                where.channelId = channelId;
            if (conversationId)
                where.conversationId = conversationId;
            const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
            const rows = await this.prisma.message.findMany({
                where,
                take: take + 1,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                include: MESSAGE_INCLUDE,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            });
            const hasMore = rows.length > take;
            const page = hasMore ? rows.slice(0, take) : rows;
            const chronological = [...page].reverse();
            const lastRead = await this.prisma.readReceipt.findFirst({
                where: {
                    userId: user.userId,
                    message: channelId ? { channelId } : { conversationId },
                },
                orderBy: { readAt: 'desc' },
                include: { message: { select: { id: true, createdAt: true } } },
            });
            return {
                items: chronological.map((m) => this.mapMessageToDto(m)),
                nextCursor: hasMore ? page[page.length - 1].id : null,
                lastReadMessageId: lastRead?.messageId ?? null,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to fetch messages', error);
        }
    }
    async syncSince(userOrId, channelId, conversationId, since) {
        const user = this.extractUser(userOrId);
        if (!channelId && !conversationId) {
            throw new common_1.BadRequestException('channelId or conversationId is required');
        }
        try {
            if (channelId) {
                await this.chatAccess.assertChannelAccess(user, channelId);
            }
            if (conversationId) {
                await this.chatAccess.assertConversationAccess(user, conversationId);
            }
            const where = {
                deletedAt: null,
                ...this.visibleMessageFilter(),
            };
            if (channelId)
                where.channelId = channelId;
            if (conversationId)
                where.conversationId = conversationId;
            if (since) {
                where.updatedAt = { gt: new Date(since) };
            }
            const rows = await this.prisma.message.findMany({
                where,
                include: MESSAGE_INCLUDE,
                orderBy: { updatedAt: 'asc' },
                take: 100,
            });
            return rows.map((m) => this.mapMessageToDto(m));
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to sync messages', error);
        }
    }
    async findOne(id, userOrId) {
        try {
            if (userOrId) {
                await this.chatAccess.assertMessageAccess(userOrId, id);
            }
            const m = await this.prisma.message.findUnique({
                where: { id },
                include: MESSAGE_INCLUDE,
            });
            if (!m || m.deletedAt) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            return this.mapMessageToDto(m);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to fetch message', error);
        }
    }
    async create(userOrId, body) {
        const user = this.extractUser(userOrId);
        const hasChannel = Boolean(body.channelId);
        const hasConversation = Boolean(body.conversationId);
        if (hasChannel === hasConversation) {
            throw new common_1.BadRequestException('Provide exactly one of channelId or conversationId');
        }
        if (body.channelId) {
            await this.chatAccess.assertChannelAccess(user, body.channelId);
        }
        if (body.conversationId) {
            await this.chatAccess.assertConversationAccess(user, body.conversationId);
        }
        if (body.parentMessageId) {
            await this.chatAccess.assertMessageAccess(user, body.parentMessageId);
        }
        if (body.clientMessageId) {
            const existing = await this.prisma.message.findFirst({
                where: { clientMessageId: body.clientMessageId },
                include: MESSAGE_INCLUDE,
            });
            if (existing) {
                return this.mapMessageToDto(existing);
            }
        }
        const trimmedContent = body.content?.trim() ?? '';
        if (!trimmedContent && (!body.attachments || body.attachments.length === 0)) {
            throw new common_1.BadRequestException('Message must include text or at least one attachment');
        }
        let scheduledFor = null;
        if (body.scheduledFor) {
            const when = new Date(body.scheduledFor);
            if (Number.isNaN(when.getTime())) {
                throw new common_1.BadRequestException('scheduledFor must be a valid ISO datetime');
            }
            if (when.getTime() <= Date.now() + 30_000) {
                throw new common_1.BadRequestException('scheduledFor must be at least 30 seconds in the future');
            }
            if (when.getTime() > Date.now() + 365 * 24 * 60 * 60 * 1000) {
                throw new common_1.BadRequestException('scheduledFor cannot be more than 1 year ahead');
            }
            scheduledFor = when;
        }
        try {
            const m = await this.prisma.$transaction(async (tx) => {
                const created = await tx.message.create({
                    data: {
                        clientMessageId: body.clientMessageId,
                        content: trimmedContent,
                        senderId: user.userId,
                        channelId: body.channelId,
                        conversationId: body.conversationId,
                        parentMessageId: body.parentMessageId,
                        scheduledFor,
                        ...(scheduledFor ? { createdAt: scheduledFor } : {}),
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
                    include: MESSAGE_INCLUDE,
                });
                if (!scheduledFor) {
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
                }
                return created;
            });
            const dto = this.mapMessageToDto(m);
            if (scheduledFor) {
                return dto;
            }
            this.realtime.emitToChat(dto, 'message:created', dto);
            void this.mentions.notifyFromMessage(dto);
            this.ai.onMessageCreated(dto);
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to create message', error);
        }
    }
    async publishDueScheduledMessages() {
        const due = await this.prisma.message.findMany({
            where: {
                deletedAt: null,
                scheduledFor: { lte: new Date() },
            },
            include: MESSAGE_INCLUDE,
            take: 50,
            orderBy: { scheduledFor: 'asc' },
        });
        let published = 0;
        for (const row of due) {
            const updated = await this.prisma.message.update({
                where: { id: row.id },
                data: {
                    scheduledFor: null,
                    createdAt: row.scheduledFor ?? new Date(),
                    updatedAt: new Date(),
                },
                include: MESSAGE_INCLUDE,
            });
            if (updated.channelId) {
                await this.prisma.channel.update({
                    where: { id: updated.channelId },
                    data: { updatedAt: new Date() },
                });
            }
            if (updated.conversationId) {
                await this.prisma.conversation.update({
                    where: { id: updated.conversationId },
                    data: { updatedAt: new Date() },
                });
            }
            const dto = this.mapMessageToDto(updated);
            this.realtime.emitToChat(dto, 'message:created', dto);
            void this.mentions.notifyFromMessage(dto);
            this.ai.onMessageCreated(dto);
            published += 1;
        }
        return published;
    }
    async update(id, content, userOrId) {
        try {
            await this.chatAccess.assertMessageModifyAccess(userOrId, id, undefined, false);
            const m = await this.prisma.message.update({
                where: { id },
                data: { content, editedAt: new Date() },
                include: MESSAGE_INCLUDE,
            });
            const dto = this.mapMessageToDto(m);
            this.realtime.emitToChat(dto, 'message:updated', dto);
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to update message', error);
        }
    }
    async delete(id, userOrId) {
        try {
            const existing = await this.chatAccess.assertMessageModifyAccess(userOrId, id, undefined, true);
            await this.prisma.message.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    content: 'This message was deleted.',
                },
            });
            this.realtime.emitToChat(existing, 'message:deleted', { id });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to delete message', error);
        }
    }
    async togglePin(id, userOrId) {
        try {
            if (userOrId) {
                await this.chatAccess.assertMessageAccess(userOrId, id);
            }
            const current = await this.prisma.message.findUnique({ where: { id } });
            if (!current || current.deletedAt) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            const m = await this.prisma.message.update({
                where: { id },
                data: { pinned: !current.pinned },
                include: MESSAGE_INCLUDE,
            });
            const dto = this.mapMessageToDto(m);
            this.realtime.emitToChat(dto, 'pin:toggled', { messageId: id, message: dto });
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to toggle pin', error);
        }
    }
    async toggleReaction(messageId, emoji, userOrId) {
        const user = this.extractUser(userOrId);
        try {
            await this.chatAccess.assertMessageAccess(user, messageId);
            await this.prisma.$transaction(async (tx) => {
                const existing = await tx.messageReaction.findUnique({
                    where: {
                        messageId_userId_emoji: {
                            messageId,
                            userId: user.userId,
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
                            userId: user.userId,
                            emoji,
                        },
                    });
                }
            });
            const dto = await this.findOne(messageId, user);
            this.realtime.emitToChat(dto, 'reaction:toggled', {
                messageId,
                message: dto,
            });
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to toggle reaction', error);
        }
    }
    async getReplies(parentMessageId, userOrId) {
        try {
            if (userOrId) {
                await this.chatAccess.assertMessageAccess(userOrId, parentMessageId);
            }
            const replies = await this.prisma.message.findMany({
                where: {
                    parentMessageId,
                    deletedAt: null,
                },
                include: MESSAGE_INCLUDE,
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            });
            return replies.map((r) => this.mapMessageToDto(r));
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to fetch replies', error);
        }
    }
    async markAsRead(messageId, userOrId) {
        const user = this.extractUser(userOrId);
        try {
            await this.chatAccess.assertMessageAccess(user, messageId);
            await this.prisma.readReceipt.upsert({
                where: {
                    messageId_userId: {
                        messageId,
                        userId: user.userId,
                    },
                },
                create: {
                    messageId,
                    userId: user.userId,
                },
                update: {
                    readAt: new Date(),
                },
            });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to mark message as read', error);
        }
    }
    async findPinnedForUser(userOrId) {
        const user = this.extractUser(userOrId);
        const memberships = await this.prisma.channelMember.findMany({
            where: { userId: user.userId },
            select: { channelId: true },
        });
        const convos = await this.prisma.conversationParticipant.findMany({
            where: { userId: user.userId },
            select: { conversationId: true },
        });
        const rows = await this.prisma.message.findMany({
            where: {
                pinned: true,
                deletedAt: null,
                OR: [
                    { channel: { workplaceId: user.workplaceId, type: 'PUBLIC' } },
                    { channel: { workplaceId: user.workplaceId }, channelId: { in: memberships.map((m) => m.channelId) } },
                    { conversation: { workplaceId: user.workplaceId }, conversationId: { in: convos.map((c) => c.conversationId) } },
                ],
            },
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return rows.map((m) => this.mapMessageToDto(m));
    }
    async findPinned(channelId, conversationId, userOrId) {
        if (!channelId && !conversationId) {
            throw new common_1.BadRequestException('channelId or conversationId is required');
        }
        if (userOrId) {
            if (channelId)
                await this.chatAccess.assertChannelAccess(userOrId, channelId);
            if (conversationId)
                await this.chatAccess.assertConversationAccess(userOrId, conversationId);
        }
        const where = {
            pinned: true,
            deletedAt: null,
            ...this.visibleMessageFilter(),
        };
        if (channelId)
            where.channelId = channelId;
        if (conversationId)
            where.conversationId = conversationId;
        const rows = await this.prisma.message.findMany({
            where,
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return rows.map((m) => this.mapMessageToDto(m));
    }
    mapMessageToDto(m) {
        return {
            id: m.id,
            clientMessageId: m.clientMessageId ?? undefined,
            content: m.content,
            senderId: m.senderId,
            senderName: m.sender?.name || 'Unknown',
            senderAvatar: m.sender?.avatarUrl ?? undefined,
            channelId: m.channelId ?? undefined,
            conversationId: m.conversationId ?? undefined,
            parentMessageId: m.parentMessageId ?? undefined,
            pinned: m.pinned,
            scheduledFor: m.scheduledFor?.toISOString(),
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
                    createdAt: a.createdAt.toISOString(),
                }))
                : [],
            tags: m.tags
                ? m.tags.map((t) => ({
                    id: t.id,
                    messageId: t.messageId,
                    userId: t.userId,
                    userName: t.user?.name || 'Team Member',
                    tag: t.tag,
                    note: t.note ?? undefined,
                    createdAt: t.createdAt.toISOString(),
                }))
                : [],
            actionItems: m.actionItems
                ? m.actionItems.map((a) => ({
                    id: a.id,
                    title: a.title,
                    description: a.description ?? undefined,
                    status: a.status,
                    dueDate: a.dueDate?.toISOString(),
                    assigneeId: a.assigneeId ?? undefined,
                    assigneeName: a.assignee?.name ?? undefined,
                    assigneeAvatar: a.assignee?.avatarUrl ?? undefined,
                    creatorId: a.creatorId,
                    creatorName: a.creator?.name ?? undefined,
                    messageId: a.messageId ?? undefined,
                    channelId: a.channelId ?? undefined,
                    conversationId: a.conversationId ?? undefined,
                    workplaceId: a.workplaceId,
                    createdAt: a.createdAt.toISOString(),
                    updatedAt: a.updatedAt.toISOString(),
                }))
                : [],
            poll: m.poll
                ? {
                    id: m.poll.id,
                    question: m.poll.question,
                    options: m.poll.options.map((text, index) => {
                        const votes = (m.poll.votes || []).filter((v) => v.optionIndex === index);
                        const voteCount = votes.length;
                        const totalVotes = (m.poll.votes || []).length;
                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                        return {
                            index,
                            text,
                            voteCount,
                            percentage,
                            voters: m.poll.isAnonymous
                                ? undefined
                                : votes.map((v) => ({
                                    id: v.user?.id || v.userId,
                                    name: v.user?.name || 'Team Member',
                                    avatarUrl: v.user?.avatarUrl,
                                })),
                        };
                    }),
                    totalVotes: (m.poll.votes || []).length,
                    totalVoters: new Set((m.poll.votes || []).map((v) => v.userId)).size,
                    isMultiChoice: m.poll.isMultiChoice,
                    isAnonymous: m.poll.isAnonymous,
                    isClosed: m.poll.isClosed,
                    createdById: m.poll.createdById,
                    creatorName: m.poll.creator?.name,
                    createdAt: m.poll.createdAt?.toISOString(),
                }
                : undefined,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => ai_orchestrator_service_1.AiOrchestratorService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_access_service_1.ChatAccessService,
        realtime_service_1.RealtimeService,
        mentions_service_1.MentionsService,
        ai_orchestrator_service_1.AiOrchestratorService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map