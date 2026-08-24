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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma.service");
const realtime_service_1 = require("../../realtime/realtime.service");
const mentions_service_1 = require("../mentions/mentions.service");
const ai_orchestrator_service_1 = require("../../ai/ai-orchestrator.service");
let MessagesService = class MessagesService {
    prisma;
    realtime;
    mentions;
    ai;
    constructor(prisma, realtime, mentions, ai) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.mentions = mentions;
        this.ai = ai;
    }
    async findAll(userId, channelId, conversationId, limit = 50, cursor) {
        if (!channelId && !conversationId) {
            throw new common_1.BadRequestException('channelId or conversationId is required');
        }
        try {
            const where = {
                deletedAt: null,
                parentMessageId: null,
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
                include: {
                    sender: true,
                    reactions: { include: { user: true } },
                    attachments: true,
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            });
            const hasMore = rows.length > take;
            const page = hasMore ? rows.slice(0, take) : rows;
            const chronological = [...page].reverse();
            const lastRead = await this.prisma.readReceipt.findFirst({
                where: {
                    userId,
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
            if (error instanceof common_1.BadRequestException)
                throw error;
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
    async create(userId, body) {
        const hasChannel = Boolean(body.channelId);
        const hasConversation = Boolean(body.conversationId);
        if (hasChannel === hasConversation) {
            throw new common_1.BadRequestException('Provide exactly one of channelId or conversationId');
        }
        const trimmedContent = body.content?.trim() ?? '';
        if (!trimmedContent && (!body.attachments || body.attachments.length === 0)) {
            throw new common_1.BadRequestException('Message must include text or at least one attachment');
        }
        try {
            const m = await this.prisma.$transaction(async (tx) => {
                const created = await tx.message.create({
                    data: {
                        content: trimmedContent,
                        senderId: userId,
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
            this.realtime.emitToChat(dto, 'message:created', dto);
            void this.mentions.notifyFromMessage(dto);
            this.ai.onMessageCreated(dto);
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to create message: ${error.message}`);
        }
    }
    async update(id, content, userId) {
        try {
            const existing = await this.prisma.message.findUnique({ where: { id } });
            if (!existing || existing.deletedAt) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            if (existing.senderId !== userId) {
                throw new common_1.ForbiddenException('You can only edit your own messages');
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
            const dto = this.mapMessageToDto(m);
            this.realtime.emitToChat(dto, 'message:updated', dto);
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Failed to update message ${id}: ${error.message}`);
        }
    }
    async delete(id, userId) {
        try {
            const existing = await this.prisma.message.findUnique({ where: { id } });
            if (!existing) {
                throw new common_1.NotFoundException(`Message ${id} not found`);
            }
            if (existing.senderId !== userId) {
                throw new common_1.ForbiddenException('You can only delete your own messages');
            }
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
            const dto = this.mapMessageToDto(m);
            this.realtime.emitToChat(dto, 'pin:toggled', { messageId: id, message: dto });
            return dto;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to toggle pin for message ${id}: ${error.message}`);
        }
    }
    async toggleReaction(messageId, emoji, userId) {
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
            const dto = await this.findOne(messageId);
            this.realtime.emitToChat(dto, 'reaction:toggled', {
                messageId,
                message: dto,
            });
            return dto;
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
    async markAsRead(messageId, userId) {
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
    async findPinnedForUser(userId) {
        const memberships = await this.prisma.channelMember.findMany({
            where: { userId },
            select: { channelId: true },
        });
        const convos = await this.prisma.conversationParticipant.findMany({
            where: { userId },
            select: { conversationId: true },
        });
        const rows = await this.prisma.message.findMany({
            where: {
                pinned: true,
                deletedAt: null,
                OR: [
                    { channel: { type: 'PUBLIC' } },
                    { channelId: { in: memberships.map((m) => m.channelId) } },
                    { conversationId: { in: convos.map((c) => c.conversationId) } },
                ],
            },
            include: {
                sender: true,
                reactions: { include: { user: true } },
                attachments: true,
                replies: { where: { deletedAt: null } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return rows.map((m) => this.mapMessageToDto(m));
    }
    async findPinned(channelId, conversationId) {
        if (!channelId && !conversationId) {
            throw new common_1.BadRequestException('channelId or conversationId is required');
        }
        const where = {
            pinned: true,
            deletedAt: null,
        };
        if (channelId)
            where.channelId = channelId;
        if (conversationId)
            where.conversationId = conversationId;
        const rows = await this.prisma.message.findMany({
            where,
            include: {
                sender: true,
                reactions: { include: { user: true } },
                attachments: true,
                replies: { where: { deletedAt: null } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return rows.map((m) => this.mapMessageToDto(m));
    }
    mapMessageToDto(m) {
        return {
            id: m.id,
            content: m.content,
            senderId: m.senderId,
            senderName: m.sender?.name || 'Unknown',
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
                    createdAt: a.createdAt.toISOString(),
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
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => ai_orchestrator_service_1.AiOrchestratorService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_service_1.RealtimeService,
        mentions_service_1.MentionsService,
        ai_orchestrator_service_1.AiOrchestratorService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map