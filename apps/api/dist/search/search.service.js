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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let SearchService = class SearchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(query, workplaceId = 'wp-teamchat-main') {
        if (!query || !query.trim()) {
            return { messages: [], channels: [], users: [] };
        }
        const q = query.trim();
        try {
            const [messages, channels, users] = await Promise.all([
                this.prisma.message.findMany({
                    where: {
                        content: { contains: q, mode: 'insensitive' },
                        deletedAt: null,
                    },
                    include: { sender: true },
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.channel.findMany({
                    where: {
                        workplaceId,
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    take: 20,
                }),
                this.prisma.user.findMany({
                    where: {
                        workplaceId,
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    take: 20,
                }),
            ]);
            return {
                messages: messages.map((m) => ({
                    id: m.id,
                    content: m.content,
                    senderId: m.senderId,
                    senderName: m.sender.name,
                    senderAvatar: m.sender.avatarUrl ?? undefined,
                    channelId: m.channelId ?? undefined,
                    conversationId: m.conversationId ?? undefined,
                    createdAt: m.createdAt.toISOString(),
                })),
                channels: channels.map((c) => ({
                    id: c.id,
                    name: c.name,
                    description: c.description ?? undefined,
                    type: c.type.toLowerCase(),
                })),
                users: users.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    avatarUrl: u.avatarUrl ?? undefined,
                    title: u.title ?? undefined,
                })),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to search: ${error.message}`);
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map