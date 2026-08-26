import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, UploadResult } from './storage-provider.interface';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  readonly uploadDir = UPLOAD_DIR;

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, customName?: string): Promise<UploadResult> {
    const originalName = file.originalname || 'file';
    const safeName = (customName || originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${randomUUID()}-${safeName}`;
    const destination = join(this.uploadDir, filename);

    if (file.buffer) {
      writeFileSync(destination, file.buffer);
    }

    return {
      name: originalName,
      size: file.size,
      type: file.mimetype || 'application/octet-stream',
      url: `/uploads/${filename}`,
      key: filename,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = join(this.uploadDir, key);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete local file ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
