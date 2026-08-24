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
const prisma_service_1 = require("../../common/prisma.service");
let ConversationsService = class ConversationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
            throw new common_1.InternalServerErrorException(`Failed to fetch conversations: ${error.message}`);
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
            throw new common_1.InternalServerErrorException(`Failed to fetch conversation ${id}: ${error.message}`);
        }
    }
    async create(data) {
        const wpId = data.workplaceId || 'wp-teamchat-main';
        const uniqueParticipants = Array.from(new Set(data.participants));
        try {
            const c = await this.prisma.$transaction(async (tx) => {
                return tx.conversation.create({
                    data: {
                        workplaceId: wpId,
                        participants: {
                            create: uniqueParticipants.map((userId) => ({ userId })),
                        },
                    },
                    include: { participants: true },
                });
            });
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
            throw new common_1.InternalServerErrorException(`Failed to create conversation: ${error.message}`);
        }
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map