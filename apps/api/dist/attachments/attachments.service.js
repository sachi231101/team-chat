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
exports.AttachmentsService = exports.UPLOAD_DIR = void 0;
exports.isAllowedMimeType = isAllowedMimeType;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const path_1 = require("path");
const storage_provider_interface_1 = require("./storage/storage-provider.interface");
exports.UPLOAD_DIR = (0, path_1.join)(process.cwd(), 'uploads');
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'application/zip',
]);
const ALLOWED_EXT = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.pdf',
    '.txt',
    '.md',
    '.csv',
    '.json',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.mp3',
    '.wav',
    '.webm',
    '.ogg',
    '.mp4',
    '.zip',
]);
function isAllowedMimeType(mime, originalName) {
    if (mime && ALLOWED_MIME.has(mime.toLowerCase()))
        return true;
    if (originalName) {
        const ext = (0, path_1.extname)(originalName).toLowerCase();
        if (ALLOWED_EXT.has(ext))
            return true;
    }
    return false;
}
let AttachmentsService = class AttachmentsService {
    storage;
    uploadDir = exports.UPLOAD_DIR;
    pendingUploads = new Map();
    constructor(storage) {
        this.storage = storage;
    }
    uniqueName(originalName) {
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${(0, crypto_1.randomUUID)()}-${safeName}`;
    }
    rememberPendingUpload(filename, userId, ttlMs = 60 * 60 * 1000) {
        this.pendingUploads.set(filename, { userId, expiresAt: Date.now() + ttlMs });
    }
    canAccessPendingUpload(filename, userId) {
        const entry = this.pendingUploads.get(filename);
        if (!entry)
            return false;
        if (entry.expiresAt < Date.now()) {
            this.pendingUploads.delete(filename);
            return false;
        }
        return entry.userId === userId;
    }
    async upload(file, customName) {
        return this.storage.upload(file, customName);
    }
    async delete(key) {
        return this.storage.delete(key);
    }
    getUrl(key) {
        return this.storage.getUrl(key);
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(storage_provider_interface_1.STORAGE_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [Object])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map