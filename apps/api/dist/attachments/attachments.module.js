"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsModule = void 0;
const common_1 = require("@nestjs/common");
const attachments_controller_1 = require("./attachments.controller");
const attachments_service_1 = require("./attachments.service");
const common_module_1 = require("../common/common.module");
const storage_provider_interface_1 = require("./storage/storage-provider.interface");
const local_storage_provider_1 = require("./storage/local-storage.provider");
const s3_storage_provider_1 = require("./storage/s3-storage.provider");
let AttachmentsModule = class AttachmentsModule {
};
exports.AttachmentsModule = AttachmentsModule;
exports.AttachmentsModule = AttachmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [common_module_1.CommonModule],
        controllers: [attachments_controller_1.AttachmentsController, attachments_controller_1.UploadsController],
        providers: [
            attachments_service_1.AttachmentsService,
            local_storage_provider_1.LocalStorageProvider,
            s3_storage_provider_1.S3StorageProvider,
            {
                provide: storage_provider_interface_1.STORAGE_PROVIDER_TOKEN,
                useFactory: () => {
                    const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
                    if (provider === 's3' || provider === 'r2') {
                        return new s3_storage_provider_1.S3StorageProvider();
                    }
                    return new local_storage_provider_1.LocalStorageProvider();
                },
            },
        ],
        exports: [attachments_service_1.AttachmentsService, storage_provider_interface_1.STORAGE_PROVIDER_TOKEN],
    })
], AttachmentsModule);
//# sourceMappingURL=attachments.module.js.map