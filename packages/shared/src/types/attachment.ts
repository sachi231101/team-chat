export interface AttachmentUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface AttachmentUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  attachmentId: string;
}
