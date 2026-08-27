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
const chat_access_service_1 = require("../chat-access.service");
const mock_identity_1 = require("../mock-identity");
let ChannelMemberGuard = class ChannelMemberGuard {
    chatAccess;
    constructor(chatAccess) {
        this.chatAccess = chatAccess;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const user = (0, mock_identity_1.attachMockIdentity)(req);
        const channelId = req.params?.channelId ||
            (req.route?.path?.includes('channels') ? req.params?.id : undefined) ||
            req.query?.channelId ||
            req.body?.channelId;
        if (!channelId || typeof channelId !== 'string') {
            throw new common_1.BadRequestException('channelId is required');
        }
        try {
            await this.chatAccess.assertChannelAccess(user, channelId);
            return true;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw error;
        }
    }
};
exports.ChannelMemberGuard = ChannelMemberGuard;
exports.ChannelMemberGuard = ChannelMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_access_service_1.ChatAccessService])
], ChannelMemberGuard);
//# sourceMappingURL=channel-member.guard.js.map