import { type StorageProvider, type UploadResult } from './storage/storage-provider.interface';
export declare const UPLOAD_DIR: string;
export declare function isAllowedMimeType(mime: string | undefined, originalName?: string): boolean;
export declare class AttachmentsService {
    private readonly storage;
    readonly uploadDir: string;
    private readonly pendingUploads;
    constructor(storage: StorageProvider);
    uniqueName(originalName: string): string;
    rememberPendingUpload(filename: string, userId: string, ttlMs?: number): void;
    canAccessPendingUpload(filename: string, userId: string): boolean;
    upload(file: Express.Multer.File, customName?: string): Promise<UploadResult>;
    delete(key: string): Promise<boolean>;
    getUrl(key: string): string;
}
