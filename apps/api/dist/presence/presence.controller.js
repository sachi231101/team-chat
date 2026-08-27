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
exports.PresenceController = void 0;
const common_1 = require("@nestjs/common");
const presence_service_1 = require("./presence.service");
const update_presence_dto_1 = require("./dto/update-presence.dto");
const decorators_1 = require("../common/decorators");
let PresenceController = class PresenceController {
    presenceService;
    constructor(presenceService) {
        this.presenceService = presenceService;
    }
    getAllPresence(user) {
        return this.presenceService.getAllPresence(user.workplaceId);
    }
    setOwnPresence(user, body) {
        return this.presenceService.setPresence(user.userId, body.status, body.statusMessage);
    }
    setPresence(user, body, userId) {
        if (userId !== user.userId && user.role !== 'admin') {
            throw new common_1.ForbiddenException('You can only update your own presence');
        }
        return this.presenceService.setPresence(userId, body.status, body.statusMessage);
    }
};
exports.PresenceController = PresenceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "getAllPresence", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_presence_dto_1.UpdatePresenceDto]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "setOwnPresence", null);
__decorate([
    (0, common_1.Patch)(':userId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_presence_dto_1.UpdatePresenceDto, String]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "setPresence", null);
exports.PresenceController = PresenceController = __decorate([
    (0, common_1.Controller)('presence'),
    __metadata("design:paramtypes", [presence_service_1.PresenceService])
], PresenceController);
//# sourceMappingURL=presence.controller.js.map