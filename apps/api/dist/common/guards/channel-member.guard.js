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
exports.ChannelMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ChannelMemberGuard = class ChannelMemberGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const userId = req.headers['x-user-id'] || req.body?.senderId || 'usr-rahul';
        const channelId = req.params?.id ||
            req.params?.channelId ||
            req.query?.channelId ||
            req.body?.channelId;
        if (!channelId) {
            return true;
        }
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException(`Channel ${channelId} not found`);
        }
        if (channel.type === 'PUBLIC') {
            return true;
        }
        const isMember = channel.members.some((m) => m.userId === userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('Access denied: You are not a member of this private channel');
        }
        return true;
    }
};
exports.ChannelMemberGuard = ChannelMemberGuard;
exports.ChannelMemberGuard = ChannelMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChannelMemberGuard);
//# sourceMappingURL=channel-member.guard.js.map