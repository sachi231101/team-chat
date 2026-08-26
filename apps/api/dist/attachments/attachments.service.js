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
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const path_1 = require("path");
const storage_provider_interface_1 = require("./storage/storage-provider.interface");
exports.UPLOAD_DIR = (0, path_1.join)(process.cwd(), 'uploads');
let AttachmentsService = class AttachmentsService {
    storage;
    uploadDir = exports.UPLOAD_DIR;
    constructor(storage) {
        this.storage = storage;
    }
    uniqueName(originalName) {
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${(0, crypto_1.randomUUID)()}-${safeName}`;
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