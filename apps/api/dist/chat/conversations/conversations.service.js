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
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma.service");
const chat_access_service_1 = require("../../common/chat-access.service");
const safe_internal_error_1 = require("../../common/safe-internal-error");
let ConversationsService = class ConversationsService {
    prisma;
    chatAccess;
    constructor(prisma, chatAccess) {
        this.prisma = prisma;
        this.chatAccess = chatAccess;
    }
    async findAll(workplaceId = 'wp-teamchat-main', userId) {
        try {
            const where = { workplaceId };
            if (userId) {
                where.participants = {
                    some: { userId },
                };
            }
            const convos = await this.prisma.conversation.findMany({
                where,
                include: { participants: true },
                orderBy: { updatedAt: 'desc' },
            });
            return convos.map((c) => ({
                id: c.id,
                participants: c.participants.map((p) => p.userId),
                workplaceId: c.workplaceId,
                unreadCount: 0,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            }));
        }
        catch (error) {
            (0, safe_internal_error_1.throwInternal)('Failed to fetch conversations', error);
        }
    }
    async findOne(id, workplaceId = 'wp-teamchat-main') {
        try {
            const c = await this.prisma.conversation.findFirst({
                where: { id, workplaceId },
                include: { participants: true },
            });
            if (!c) {
                throw new common_1.NotFoundException(`Conversation ${id} not found in workplace ${workplaceId}`);
            }
            return {
                id: c.id,
                participants: c.participants.map((p) => p.userId),
                workplaceId: c.workplaceId,
                unreadCount: 0,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to fetch conversation', error);
        }
    }
    async create(data) {
        const wpId = data.workplaceId || 'wp-teamchat-main';
        const uniqueParticipants = Array.from(new Set(data.participants));
        try {
            await this.chatAccess.assertUsersBelongToWorkplace(wpId, uniqueParticipants);
            const conversation = await this.prisma.$transaction(async (tx) => {
                const existing = await this.findMatchingConversationTx(tx, wpId, uniqueParticipants);
                if (existing)
                    return existing;
                return tx.conversation.create({
                    data: {
                        workplaceId: wpId,
                        participants: {
                            create: uniqueParticipants.map((userId) => ({ userId })),
                        },
                    },
                    include: { participants: true },
                });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
            return {
                id: conversation.id,
                participants: conversation.participants.map((p) => p.userId),
                workplaceId: conversation.workplaceId,
                unreadCount: 0,
                createdAt: conversation.createdAt.toISOString(),
                updatedAt: conversation.updatedAt.toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.ForbiddenException)
                throw error;
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2034') {
                const existing = await this.findMatchingConversation(wpId, uniqueParticipants);
                if (existing)
                    return existing;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to create conversation', error);
        }
    }
    async findMatchingConversation(workplaceId, participantIds) {
        const match = await this.findMatchingConversationTx(this.prisma, workplaceId, participantIds);
        if (!match)
            return null;
        return {
            id: match.id,
            participants: match.participants.map((p) => p.userId),
            workplaceId: match.workplaceId,
            unreadCount: 0,
            createdAt: match.createdAt.toISOString(),
            updatedAt: match.updatedAt.toISOString(),
        };
    }
    async findMatchingConversationTx(db, workplaceId, participantIds) {
        const wanted = [...participantIds].sort();
        const convos = await db.conversation.findMany({
            where: {
                workplaceId,
                participants: { some: { userId: { in: wanted } } },
            },
            include: { participants: true },
        });
        return (convos.find((c) => {
            const ids = c.participants.map((p) => p.userId).sort();
            return ids.length === wanted.length && ids.every((id, i) => id === wanted[i]);
        }) ?? null);
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_access_service_1.ChatAccessService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map