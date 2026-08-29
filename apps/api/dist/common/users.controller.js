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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const safe_internal_error_1 = require("./safe-internal-error");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_presence_dto_1 = require("../presence/dto/update-presence.dto");
const prisma_errors_1 = require("./prisma-errors");
const default_channels_1 = require("./default-channels");
const decorators_1 = require("./decorators");
const workplace_read_cache_interceptor_1 = require("../redis/workplace-read-cache.interceptor");
let UsersController = class UsersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(user) {
        try {
            const users = await this.prisma.user.findMany({
                where: { workplaceId: user.workplaceId },
                orderBy: { createdAt: 'asc' },
            });
            return users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                title: u.title ?? undefined,
                status: u.status.toLowerCase(),
                statusMessage: u.statusMessage ?? undefined,
                workplaceId: u.workplaceId,
                createdAt: u.createdAt.toISOString(),
            }));
        }
        catch (error) {
            (0, safe_internal_error_1.throwInternal)('Failed to fetch users', error);
        }
    }
    async findOne(id, user) {
        try {
            const u = await this.prisma.user.findFirst({
                where: { id, workplaceId: user.workplaceId },
            });
            if (!u) {
                throw new common_1.NotFoundException(`User ${id} not found in this workplace`);
            }
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                title: u.title ?? undefined,
                status: u.status.toLowerCase(),
                statusMessage: u.statusMessage ?? undefined,
                workplaceId: u.workplaceId,
                createdAt: u.createdAt.toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            (0, safe_internal_error_1.throwInternal)(`Failed to fetch user ${id}`, error);
        }
    }
    async create(user, body) {
        try {
            const prismaStatus = (body.status?.toUpperCase() || 'ONLINE');
            const workplaceId = user.workplaceId || body.workplaceId || 'wp-teamchat-main';
            const u = await this.prisma.user.create({
                data: {
                    name: body.name,
                    email: body.email,
                    avatarUrl: body.avatarUrl,
                    title: body.title,
                    status: prismaStatus,
                    statusMessage: body.statusMessage,
                    workplaceId,
                },
            });
            await (0, default_channels_1.provisionUserPublicChannels)(this.prisma, u.id, u.workplaceId);
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                title: u.title ?? undefined,
                status: u.status.toLowerCase(),
                statusMessage: u.statusMessage ?? undefined,
                workplaceId: u.workplaceId,
                createdAt: u.createdAt.toISOString(),
            };
        }
        catch (error) {
            (0, safe_internal_error_1.throwInternal)('Failed to create user', error);
        }
    }
    async update(id, user, body) {
        try {
            const existing = await this.prisma.user.findFirst({
                where: { id, workplaceId: user.workplaceId },
            });
            if (!existing) {
                throw new common_1.NotFoundException(`User ${id} not found in this workplace`);
            }
            if (id !== user.userId && user.role !== 'admin') {
                throw new common_1.ForbiddenException('You can only update your own profile');
            }
            const data = {};
            if (body.name !== undefined)
                data.name = body.name;
            if (body.email !== undefined)
                data.email = body.email;
            if (body.avatarUrl !== undefined)
                data.avatarUrl = body.avatarUrl;
            if (body.title !== undefined)
                data.title = body.title;
            if (body.status !== undefined) {
                data.status = body.status.toUpperCase();
            }
            if (body.statusMessage !== undefined)
                data.statusMessage = body.statusMessage;
            const u = await this.prisma.user.update({
                where: { id },
                data,
            });
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                title: u.title ?? undefined,
                status: u.status.toLowerCase(),
                statusMessage: u.statusMessage ?? undefined,
                workplaceId: u.workplaceId,
                createdAt: u.createdAt.toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            if ((0, prisma_errors_1.isPrismaNotFound)(error)) {
                throw new common_1.NotFoundException(`User ${id} not found`);
            }
            (0, safe_internal_error_1.throwInternal)(`Failed to update user ${id}`, error);
        }
    }
    async updateStatus(id, user, body) {
        try {
            const existing = await this.prisma.user.findFirst({
                where: { id, workplaceId: user.workplaceId },
            });
            if (!existing) {
                throw new common_1.NotFoundException(`User ${id} not found in this workplace`);
            }
            if (id !== user.userId) {
                throw new common_1.ForbiddenException('You can only update your own status');
            }
            const prismaStatus = body.status.toUpperCase();
            const u = await this.prisma.user.update({
                where: { id },
                data: {
                    status: prismaStatus,
                    statusMessage: body.statusMessage,
                },
            });
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                title: u.title ?? undefined,
                status: u.status.toLowerCase(),
                statusMessage: u.statusMessage ?? undefined,
                workplaceId: u.workplaceId,
                createdAt: u.createdAt.toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            if ((0, prisma_errors_1.isPrismaNotFound)(error)) {
                throw new common_1.NotFoundException(`User ${id} not found`);
            }
            (0, safe_internal_error_1.throwInternal)(`Failed to update status for user ${id}`, error);
        }
    }
    async delete(id, user) {
        try {
            const existing = await this.prisma.user.findFirst({
                where: { id, workplaceId: user.workplaceId },
            });
            if (!existing) {
                throw new common_1.NotFoundException(`User ${id} not found in this workplace`);
            }
            if (id !== user.userId && user.role !== 'admin') {
                throw new common_1.ForbiddenException('You can only delete your own profile');
            }
            await this.prisma.user.delete({ where: { id } });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException)
                throw error;
            if ((0, prisma_errors_1.isPrismaNotFound)(error)) {
                throw new common_1.NotFoundException(`User ${id} not found`);
            }
            (0, safe_internal_error_1.throwInternal)(`Failed to delete user ${id}`, error);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseInterceptors)(workplace_read_cache_interceptor_1.WorkplaceReadCacheInterceptor),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_presence_dto_1.UpdatePresenceDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map