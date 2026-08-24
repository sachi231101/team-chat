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
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const prisma_errors_1 = require("../common/prisma-errors");
let PresenceService = class PresenceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllPresence(workplaceId = 'wp-teamchat-main') {
        try {
            const users = await this.prisma.user.findMany({
                where: { workplaceId },
                select: { id: true, status: true, statusMessage: true },
            });
            return users.map((u) => ({
                userId: u.id,
                status: u.status.toLowerCase(),
                statusMessage: u.statusMessage ?? undefined,
            }));
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to fetch presence: ${error.message}`);
        }
    }
    async setPresence(userId, status, statusMessage) {
        try {
            const prismaStatus = status.toUpperCase();
            const u = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    status: prismaStatus,
                    statusMessage,
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
            if ((0, prisma_errors_1.isPrismaNotFound)(error)) {
                throw new common_1.NotFoundException(`User ${userId} not found`);
            }
            throw new common_1.InternalServerErrorException(`Failed to update presence for ${userId}: ${error.message}`);
        }
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PresenceService);
//# sourceMappingURL=presence.service.js.map