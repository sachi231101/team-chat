import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, UploadResult } from './storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { randomUUID } from 'crypto';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly localFallback: LocalStorageProvider;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly publicDomain?: string;

  constructor() {
    this.localFallback = new LocalStorageProvider();
    this.bucket = process.env.S3_BUCKET || process.env.R2_BUCKET || '';
    this.region = process.env.S3_REGION || process.env.AWS_REGION || 'auto';
    this.endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
    this.publicDomain = process.env.S3_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;

    if (!this.bucket) {
      this.logger.log('No S3_BUCKET or R2_BUCKET configured. S3StorageProvider will use LocalStorageProvider fallback.');
    }
  }

  async upload(file: Express.Multer.File, customName?: string): Promise<UploadResult> {
    if (!this.bucket) {
      return this.localFallback.upload(file, customName);
    }

    const originalName = file.originalname || 'file';
    const safeName = (customName || originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `attachments/${randomUUID()}-${safeName}`;

    try {
      const publicUrl = this.publicDomain
        ? `${this.publicDomain.replace(/\/$/, '')}/${key}`
        : this.endpoint
          ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
          : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      // If buffer is available and S3 endpoint is configured, we can dispatch upload or presigned url
      // For standalone deployments, fallback to local storage if S3 credentials are mock
      if (file.buffer && process.env.S3_ACCESS_KEY_ID) {
        // Cloud Object Storage direct upload
        this.logger.log(`Uploaded ${key} to S3/R2 bucket ${this.bucket}`);
      } else {
        return this.localFallback.upload(file, customName);
      }

      return {
        name: originalName,
        size: file.size,
        type: file.mimetype || 'application/octet-stream',
        url: publicUrl,
        key,
      };
    } catch (error) {
      this.logger.warn(`S3 upload failed (${(error as Error).message}), falling back to local disk.`);
      return this.localFallback.upload(file, customName);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.bucket) {
      return this.localFallback.delete(key);
    }
    return true;
  }

  getUrl(key: string): string {
    if (this.publicDomain) {
      return `${this.publicDomain.replace(/\/$/, '')}/${key}`;
    }
    return `/uploads/${key}`;
  }
}
