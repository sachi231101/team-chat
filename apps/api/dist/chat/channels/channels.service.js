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
exports.ChannelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma.service");
const chat_access_service_1 = require("../../common/chat-access.service");
const safe_internal_error_1 = require("../../common/safe-internal-error");
const client_1 = require("@prisma/client");
let ChannelsService = class ChannelsService {
    prisma;
    chatAccess;
    constructor(prisma, chatAccess) {
        this.prisma = prisma;
        this.chatAccess = chatAccess;
    }
    async findAll(workplaceId = 'ws-acme-hq-dev', userId) {
        try {
            const channels = await this.prisma.channel.findMany({
                where: {
                    workplaceId,
                    ...(userId
                        ? { OR: [{ type: client_1.ChannelType.PUBLIC }, { members: { some: { userId } } }] }
                        : {}),
                },
                include: { members: true },
                orderBy: { createdAt: 'asc' },
            });
            return channels.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description ?? undefined,
                topic: c.topic ?? undefined,
                type: c.type === client_1.ChannelType.PRIVATE ? 'private' : 'public',
                workplaceId: c.workplaceId,
                createdById: c.createdById,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                unreadCount: 0,
                membersCount: c.members.length,
            }));
        }
        catch (error) {
            (0, safe_internal_error_1.throwInternal)('Failed to fetch channels', error);
        }
    }
    async findOne(id, workplaceId = 'ws-acme-hq-dev') {
        try {
            const c = await this.prisma.channel.findFirst({
                where: { id, workplaceId },
                include: { members: true },
            });
            if (!c) {
                throw new common_1.NotFoundException(`Channel ${id} not found in workplace ${workplaceId}`);
            }
            return {
                id: c.id,
                name: c.name,
                description: c.description ?? undefined,
                topic: c.topic ?? undefined,
                type: c.type === client_1.ChannelType.PRIVATE ? 'private' : 'public',
                workplaceId: c.workplaceId,
                createdById: c.createdById,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                unreadCount: 0,
                membersCount: c.members.length,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            (0, safe_internal_error_1.throwInternal)(`Failed to fetch channel`, error);
        }
    }
    async create(data) {
        const creatorId = data.createdById;
        if (!creatorId) {
            (0, safe_internal_error_1.throwInternal)('createdById is required');
        }
        const wpId = data.workplaceId || 'ws-acme-hq-dev';
        const normalizedName = data.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const channel = await tx.channel.create({
                    data: {
                        name: normalizedName,
                        description: data.description,
                        topic: data.topic,
                        type: data.type === 'private' ? client_1.ChannelType.PRIVATE : client_1.ChannelType.PUBLIC,
                        createdById: creatorId,
                        workplaceId: wpId,
                        members: {
                            create: {
                                userId: creatorId,
                                role: client_1.ChannelMemberRole.ADMIN,
                            },
                        },
                    },
                    include: { members: true },
                });
                return channel;
            });
            return {
                id: result.id,
                name: result.name,
                description: result.description ?? undefined,
                topic: result.topic ?? undefined,
                type: result.type === client_1.ChannelType.PRIVATE ? 'private' : 'public',
                workplaceId: result.workplaceId,
                createdById: result.createdById,
                createdAt: result.createdAt.toISOString(),
                updatedAt: result.updatedAt.toISOString(),
                unreadCount: 0,
                membersCount: result.members.length,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Channel #${normalizedName} already exists`);
            }
            (0, safe_internal_error_1.throwInternal)('Failed to create channel', error);
        }
    }
    async getMembers(channelId, user) {
        try {
            if (user) {
                await this.chatAccess.assertChannelAccess(user, channelId);
            }
            const members = await this.prisma.channelMember.findMany({
                where: { channelId },
                include: { user: true },
                orderBy: { joinedAt: 'asc' },
            });
            return members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                avatarUrl: m.user.avatarUrl ?? undefined,
                title: m.user.title ?? undefined,
                status: m.user.status.toLowerCase(),
                statusMessage: m.user.statusMessage ?? undefined,
                workplaceId: m.user.workplaceId,
                createdAt: m.user.createdAt.toISOString(),
            }));
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            (0, safe_internal_error_1.throwInternal)('Failed to fetch channel members', error);
        }
    }
    async addMembers(channelId, userIds, user) {
        try {
            if (!user) {
                throw new common_1.UnauthorizedException('Authentication required');
            }
            await this.chatAccess.assertCanManageChannelMembers(user, channelId);
            await this.chatAccess.assertUsersBelongToWorkplace(user.workplaceId, userIds);
            await this.prisma.$transaction(userIds.map((userId) => this.prisma.channelMember.upsert({
                where: {
                    channelId_userId: { channelId, userId },
                },
                create: { channelId, userId, role: client_1.ChannelMemberRole.MEMBER },
                update: {},
            })));
            return this.getMembers(channelId, user);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException ||
                error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to add channel members', error);
        }
    }
    async removeMember(channelId, targetUserId, user) {
        try {
            if (!user) {
                throw new common_1.UnauthorizedException('Authentication required');
            }
            await this.chatAccess.assertUsersBelongToWorkplace(user.workplaceId, [targetUserId]);
            if (user.userId === targetUserId) {
                await this.chatAccess.assertChannelMembership(user, channelId);
            }
            else {
                await this.chatAccess.assertCanManageChannelMembers(user, channelId);
            }
            await this.prisma.channelMember.deleteMany({
                where: { channelId, userId: targetUserId },
            });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException ||
                error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            (0, safe_internal_error_1.throwInternal)('Failed to remove channel member', error);
        }
    }
};
exports.ChannelsService = ChannelsService;
exports.ChannelsService = ChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_access_service_1.ChatAccessService])
], ChannelsService);
//# sourceMappingURL=channels.service.js.map