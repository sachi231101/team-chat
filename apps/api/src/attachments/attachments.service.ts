import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { join } from 'path';
import {
  STORAGE_PROVIDER_TOKEN,
  type StorageProvider,
  type UploadResult,
} from './storage/storage-provider.interface';


export const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class AttachmentsService {
  readonly uploadDir = UPLOAD_DIR;

  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storage: StorageProvider,
  ) {}

  uniqueName(originalName: string): string {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${randomUUID()}-${safeName}`;
  }

  async upload(file: Express.Multer.File, customName?: string): Promise<UploadResult> {
    return this.storage.upload(file, customName);
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  getUrl(key: string): string {
    return this.storage.getUrl(key);
  }
}

