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
exports.ChannelsController = void 0;
const common_1 = require("@nestjs/common");
const channels_service_1 = require("./channels.service");
const create_channel_dto_1 = require("./dto/create-channel.dto");
const add_member_dto_1 = require("./dto/add-member.dto");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
let ChannelsController = class ChannelsController {
    channelsService;
    constructor(channelsService) {
        this.channelsService = channelsService;
    }
    findAll(user) {
        return this.channelsService.findAll(user.workplaceId, user.id);
    }
    findOne(id, user) {
        return this.channelsService.findOne(id, user.workplaceId);
    }
    create(user, body) {
        return this.channelsService.create({
            ...body,
            createdById: user.id,
            workplaceId: user.workplaceId,
        });
    }
    getMembers(id) {
        return this.channelsService.getMembers(id);
    }
    addMembers(id, body) {
        return this.channelsService.addMembers(id, body.userIds);
    }
    removeMember(id, userId) {
        return this.channelsService.removeMember(id, userId);
    }
};
exports.ChannelsController = ChannelsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(guards_1.ChannelMemberGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_channel_dto_1.CreateChannelDto]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, common_1.UseGuards)(guards_1.ChannelMemberGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, common_1.UseGuards)(guards_1.ChannelMemberGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_member_dto_1.AddChannelMembersDto]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "addMembers", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, common_1.UseGuards)(guards_1.ChannelMemberGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ChannelsController.prototype, "removeMember", null);
exports.ChannelsController = ChannelsController = __decorate([
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channels_service_1.ChannelsService])
], ChannelsController);
//# sourceMappingURL=channels.controller.js.map