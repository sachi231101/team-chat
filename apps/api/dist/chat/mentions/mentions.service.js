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
exports.MentionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma.service");
let MentionsService = class MentionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    extractMentions(content) {
        const mentionRegex = /@([\w.\- ]+?)(?=\s|$|[.,!?;:])/g;
        const names = [];
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            names.push(match[1].trim());
        }
        return names;
    }
    async notifyFromMessage(message) {
        let workplaceId = 'ws-acme-hq-dev';
        let allowedUserIds = new Set();
        if (message.channelId) {
            const channel = await this.prisma.channel.findUnique({
                where: { id: message.channelId },
                include: { members: true },
            });
            if (!channel)
                return;
            workplaceId = channel.workplaceId;
            if (channel.type === client_1.ChannelType.PRIVATE) {
                allowedUserIds = new Set(channel.members.map((m) => m.userId));
            }
        }
        else if (message.conversationId) {
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: message.conversationId },
                include: { participants: true },
            });
            if (!conversation)
                return;
            workplaceId = conversation.workplaceId;
            allowedUserIds = new Set(conversation.participants.map((p) => p.userId));
        }
        const names = this.extractMentions(message.content);
        const users = await this.prisma.user.findMany({
            where: { workplaceId },
        });
        const byName = new Map(users.map((u) => [u.name.toLowerCase(), u]));
        const mentioned = new Set();
        for (const name of names) {
            const user = byName.get(name.toLowerCase());
            if (user && user.id !== message.senderId && !user.id.startsWith('usr-agent-')) {
                if (allowedUserIds.size > 0 && !allowedUserIds.has(user.id)) {
                    continue;
                }
                mentioned.add(user.id);
            }
        }
        for (const userId of mentioned) {
            await this.prisma.notification.create({
                data: {
                    userId,
                    title: `${message.senderName} mentioned you`,
                    body: message.content.slice(0, 180),
                    type: client_1.NotificationType.MENTION,
                    channelId: message.channelId,
                    conversationId: message.conversationId,
                    messageId: message.id,
                },
            });
        }
        if (message.parentMessageId) {
            const parent = await this.prisma.message.findUnique({
                where: { id: message.parentMessageId },
            });
            if (parent &&
                parent.senderId !== message.senderId &&
                !mentioned.has(parent.senderId) &&
                (allowedUserIds.size === 0 || allowedUserIds.has(parent.senderId))) {
                await this.prisma.notification.create({
                    data: {
                        userId: parent.senderId,
                        title: `${message.senderName} replied to your message`,
                        body: message.content.slice(0, 180),
                        type: client_1.NotificationType.REPLY,
                        channelId: message.channelId,
                        conversationId: message.conversationId,
                        messageId: message.id,
                    },
                });
            }
        }
        if (message.conversationId && !message.parentMessageId) {
            const participants = await this.prisma.conversationParticipant.findMany({
                where: { conversationId: message.conversationId },
            });
            for (const p of participants) {
                if (p.userId === message.senderId || mentioned.has(p.userId))
                    continue;
                await this.prisma.notification.create({
                    data: {
                        userId: p.userId,
                        title: `New message from ${message.senderName}`,
                        body: message.content.slice(0, 180),
                        type: client_1.NotificationType.DIRECT_MESSAGE,
                        conversationId: message.conversationId,
                        messageId: message.id,
                    },
                });
            }
        }
    }
};
exports.MentionsService = MentionsService;
exports.MentionsService = MentionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MentionsService);
//# sourceMappingURL=mentions.service.js.map