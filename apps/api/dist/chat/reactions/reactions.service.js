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
exports.ReactionsService = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("../messages/messages.service");
let ReactionsService = class ReactionsService {
    messagesService;
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async addReaction(messageId, emoji, user) {
        const updated = await this.messagesService.toggleReaction(messageId, emoji, user);
        return { success: true, message: updated };
    }
    async removeReaction(messageId, emoji, user) {
        const updated = await this.messagesService.toggleReaction(messageId, emoji, user);
        return { success: true, message: updated };
    }
};
exports.ReactionsService = ReactionsService;
exports.ReactionsService = ReactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], ReactionsService);
//# sourceMappingURL=reactions.service.js.map