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
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_presence_dto_1 = require("../presence/dto/update-presence.dto");
let UsersController = class UsersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            const users = await this.prisma.user.findMany({
                where: { workplaceId: 'wp-teamchat-main' },
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
            throw new common_1.InternalServerErrorException(`Failed to fetch users: ${error.message}`);
        }
    }
    async findOne(id) {
        try {
            const u = await this.prisma.user.findUnique({ where: { id } });
            if (!u) {
                throw new common_1.NotFoundException(`User ${id} not found`);
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
            throw new common_1.InternalServerErrorException(`Failed to fetch user ${id}: ${error.message}`);
        }
    }
    async create(body) {
        try {
            const prismaStatus = (body.status?.toUpperCase() || 'ONLINE');
            const u = await this.prisma.user.create({
                data: {
                    name: body.name,
                    email: body.email,
                    avatarUrl: body.avatarUrl,
                    title: body.title,
                    status: prismaStatus,
                    statusMessage: body.statusMessage,
                    workplaceId: body.workplaceId || 'wp-teamchat-main',
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
            throw new common_1.InternalServerErrorException(`Failed to create user: ${error.message}`);
        }
    }
    async update(id, body) {
        try {
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
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`User ${id} not found`);
            }
            throw new common_1.InternalServerErrorException(`Failed to update user ${id}: ${error.message}`);
        }
    }
    async updateStatus(id, body) {
        try {
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
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`User ${id} not found`);
            }
            throw new common_1.InternalServerErrorException(`Failed to update status for user ${id}: ${error.message}`);
        }
    }
    async delete(id) {
        try {
            await this.prisma.user.delete({ where: { id } });
            return { success: true };
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`User ${id} not found`);
            }
            throw new common_1.InternalServerErrorException(`Failed to delete user ${id}: ${error.message}`);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_presence_dto_1.UpdatePresenceDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map