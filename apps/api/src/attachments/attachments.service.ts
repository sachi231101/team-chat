import { Injectable } from '@nestjs/common';

@Injectable()
export class AttachmentsService {
  async getUploadUrl(fileName: string, mimeType: string) {
    return {
      uploadUrl: `https://storage.local/upload/${fileName}`,
      fileUrl: `https://storage.local/files/${fileName}`,
      attachmentId: 'att-mock-id',
    };
  }
}
