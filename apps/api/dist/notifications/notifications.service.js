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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const safe_internal_error_1 = require("../common/safe-internal-error");
const prisma_errors_1 = require("../common/prisma-errors");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        try {
            const notifications = await this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            return notifications.map((n) => ({
                id: n.id,
                title: n.title,
                body: n.body,
                time: this.formatTimeAgo(n.createdAt),
                type: n.type === 'DIRECT_MESSAGE'
                    ? 'dm'
                    : n.type.toLowerCase(),
                channelId: n.channelId ?? undefined,
                conversationId: n.conversationId ?? undefined,
                messageId: n.messageId ?? undefined,
                unread: n.unread,
                createdAt: n.createdAt.toISOString(),
            }));
        }
        catch (error) {
            (0, safe_internal_error_1.throwInternal)('Failed to fetch notifications', error);
        }
    }
    async markAsRead(id, userId) {
        try {
            const existing = await this.prisma.notification.findFirst({
                where: { id, userId },
            });
            if (!existing) {
                throw new common_1.NotFoundException(`Notification ${id} not found`);
            }
            await this.prisma.notification.update({
                where: { id },
                data: { unread: false },
            });
            return { success: true };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            if ((0, prisma_errors_1.isPrismaNotFound)(error)) {
                throw new common_1.NotFoundException(`Notification ${id} not found`);
            }
            (0, safe_internal_error_1.throwInternal)(`Failed to mark notification ${id} as read`, error);
        }
    }
    async markAllAsRead(userId) {
        try {
            await this.prisma.notification.updateMany({
                where: { userId },
                data: { unread: false },
            });
            return { success: true };
        }
        catch (error) {
            (0, safe_internal_error_1.throwInternal)('Failed to mark all notifications as read', error);
        }
    }
    formatTimeAgo(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60)
            return 'Just now';
        if (diff < 3600)
            return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400)
            return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map