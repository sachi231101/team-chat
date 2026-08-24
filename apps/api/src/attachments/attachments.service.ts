import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class AttachmentsService {
  readonly uploadDir = UPLOAD_DIR;

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  uniqueName(originalName: string): string {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${randomUUID()}-${safeName}`;
  }
}
