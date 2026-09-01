"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const users_controller_1 = require("./users.controller");
const chat_access_service_1 = require("./chat-access.service");
const platform_verify_service_1 = require("./platform-verify.service");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [users_controller_1.UsersController],
        providers: [prisma_service_1.PrismaService, chat_access_service_1.ChatAccessService, platform_verify_service_1.PlatformVerifyService],
        exports: [prisma_service_1.PrismaService, chat_access_service_1.ChatAccessService, platform_verify_service_1.PlatformVerifyService],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map