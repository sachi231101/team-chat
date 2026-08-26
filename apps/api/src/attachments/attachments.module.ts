import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { STORAGE_PROVIDER_TOKEN } from './storage/storage-provider.interface';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { S3StorageProvider } from './storage/s3-storage.provider';

@Module({
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: () => {
        const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
        if (provider === 's3' || provider === 'r2') {
          return new S3StorageProvider();
        }
        return new LocalStorageProvider();
      },
    },
  ],
  exports: [AttachmentsService, STORAGE_PROVIDER_TOKEN],
})
export class AttachmentsModule {}

