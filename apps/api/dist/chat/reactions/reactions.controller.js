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
exports.ReactionsController = void 0;
const common_1 = require("@nestjs/common");
const reactions_service_1 = require("./reactions.service");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
let ReactionsController = class ReactionsController {
    reactionsService;
    constructor(reactionsService) {
        this.reactionsService = reactionsService;
    }
    async addReaction(messageId, emoji, user) {
        return this.reactionsService.addReaction(messageId, emoji, user);
    }
    async removeReaction(messageId, emoji, user) {
        return this.reactionsService.removeReaction(messageId, emoji, user);
    }
};
exports.ReactionsController = ReactionsController;
__decorate([
    (0, common_1.Post)(':messageId'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)('emoji')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReactionsController.prototype, "addReaction", null);
__decorate([
    (0, common_1.Delete)(':messageId/:emoji'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Param)('emoji')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReactionsController.prototype, "removeReaction", null);
exports.ReactionsController = ReactionsController = __decorate([
    (0, common_1.Controller)('reactions'),
    (0, common_1.UseGuards)(guards_1.MessageAccessGuard),
    __metadata("design:paramtypes", [reactions_service_1.ReactionsService])
], ReactionsController);
//# sourceMappingURL=reactions.controller.js.map