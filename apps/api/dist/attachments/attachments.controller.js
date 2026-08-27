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
exports.UploadsController = exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const crypto_1 = require("crypto");
const path_1 = require("path");
const fs_1 = require("fs");
const attachments_service_1 = require("./attachments.service");
const chat_access_service_1 = require("../common/chat-access.service");
const decorators_1 = require("../common/decorators");
let AttachmentsController = class AttachmentsController {
    chatAccess;
    attachments;
    constructor(chatAccess, attachments) {
        this.chatAccess = chatAccess;
        this.attachments = attachments;
    }
    upload(file, user) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        if (!(0, attachments_service_1.isAllowedMimeType)(file.mimetype, file.originalname)) {
            throw new common_1.BadRequestException(`File type not allowed: ${file.mimetype || 'unknown'}`);
        }
        const url = `/uploads/${file.filename}`;
        this.attachments.rememberPendingUpload(file.filename, user.id);
        return {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            url,
        };
    }
    async download(filename, user, res) {
        const safe = (0, path_1.basename)(filename);
        if (!safe || safe !== filename || filename.includes('..')) {
            throw new common_1.BadRequestException('Invalid filename');
        }
        const url = `/uploads/${safe}`;
        await this.assertDownloadAccess(user, url, safe);
        const filePath = (0, path_1.join)(attachments_service_1.UPLOAD_DIR, safe);
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new common_1.NotFoundException('File not found');
        }
        return res.sendFile(filePath);
    }
    async verifyAccess(id, user) {
        const attachment = await this.chatAccess.assertAttachmentAccess(user, id);
        return { allowed: true, attachmentId: attachment.id };
    }
    async assertDownloadAccess(user, url, filename) {
        if (this.attachments.canAccessPendingUpload(filename, user.id)) {
            return;
        }
        try {
            await this.chatAccess.assertAttachmentAccess(user, url);
        }
        catch (err) {
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw new common_1.ForbiddenException('You do not have access to this file');
            }
            throw err;
        }
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: attachments_service_1.UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
                cb(null, `${(0, crypto_1.randomUUID)()}-${safeName}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!(0, attachments_service_1.isAllowedMimeType)(file.mimetype, file.originalname)) {
                cb(new common_1.BadRequestException(`File type not allowed: ${file.mimetype || 'unknown'}`), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('file/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "download", null);
__decorate([
    (0, common_1.Get)(':id/access'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "verifyAccess", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, common_1.Controller)('attachments'),
    __metadata("design:paramtypes", [chat_access_service_1.ChatAccessService,
        attachments_service_1.AttachmentsService])
], AttachmentsController);
let UploadsController = class UploadsController {
    chatAccess;
    attachments;
    constructor(chatAccess, attachments) {
        this.chatAccess = chatAccess;
        this.attachments = attachments;
    }
    async download(filename, user, queryUserId, queryWorkplaceId, res) {
        const effectiveUser = {
            ...user,
            id: queryUserId?.trim() || user.id,
            userId: queryUserId?.trim() || user.userId,
            workplaceId: queryWorkplaceId?.trim() || user.workplaceId,
        };
        const safe = (0, path_1.basename)(filename);
        if (!safe || safe !== filename || filename.includes('..')) {
            throw new common_1.BadRequestException('Invalid filename');
        }
        const url = `/uploads/${safe}`;
        if (!this.attachments.canAccessPendingUpload(safe, effectiveUser.id)) {
            try {
                await this.chatAccess.assertAttachmentAccess(effectiveUser, url);
            }
            catch {
                throw new common_1.ForbiddenException('You do not have access to this file');
            }
        }
        const filePath = (0, path_1.join)(attachments_service_1.UPLOAD_DIR, safe);
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new common_1.NotFoundException('File not found');
        }
        return res.sendFile(filePath);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Get)(':filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('x-user-id')),
    __param(3, (0, common_1.Query)('x-workplace-id')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "download", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [chat_access_service_1.ChatAccessService,
        attachments_service_1.AttachmentsService])
], UploadsController);
//# sourceMappingURL=attachments.controller.js.map