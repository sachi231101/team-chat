export interface UploadResult {
  url: string;
  size: number;
  name: string;
  key: string;
  type: string;
}

export interface StorageProvider {
  upload(file: Express.Multer.File, customName?: string): Promise<UploadResult>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER_TOKEN';
