import { type StorageProvider, type UploadResult } from './storage/storage-provider.interface';
export declare const UPLOAD_DIR: string;
export declare class AttachmentsService {
    private readonly storage;
    readonly uploadDir: string;
    constructor(storage: StorageProvider);
    uniqueName(originalName: string): string;
    upload(file: Express.Multer.File, customName?: string): Promise<UploadResult>;
    delete(key: string): Promise<boolean>;
    getUrl(key: string): string;
}
