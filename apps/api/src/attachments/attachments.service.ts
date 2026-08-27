import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { join, extname } from 'path';
import {
  STORAGE_PROVIDER_TOKEN,
  type StorageProvider,
  type UploadResult,
} from './storage/storage-provider.interface';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

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

export function isAllowedMimeType(mime: string | undefined, originalName?: string): boolean {
  if (mime && ALLOWED_MIME.has(mime.toLowerCase())) return true;
  if (originalName) {
    const ext = extname(originalName).toLowerCase();
    if (ALLOWED_EXT.has(ext)) return true;
  }
  return false;
}

@Injectable()
export class AttachmentsService {
  readonly uploadDir = UPLOAD_DIR;

  /** Files uploaded but not yet linked to a message (preview / composer). */
  private readonly pendingUploads = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storage: StorageProvider,
  ) {}

  uniqueName(originalName: string): string {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${randomUUID()}-${safeName}`;
  }

  rememberPendingUpload(filename: string, userId: string, ttlMs = 60 * 60 * 1000): void {
    this.pendingUploads.set(filename, { userId, expiresAt: Date.now() + ttlMs });
  }

  canAccessPendingUpload(filename: string, userId: string): boolean {
    const entry = this.pendingUploads.get(filename);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.pendingUploads.delete(filename);
      return false;
    }
    return entry.userId === userId;
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
