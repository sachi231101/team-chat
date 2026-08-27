import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { basename, join } from 'path';
import { existsSync } from 'fs';
import type { Response } from 'express';
import { UPLOAD_DIR, AttachmentsService, isAllowedMimeType } from './attachments.service';
import { ChatAccessService } from '../common/chat-access.service';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';

@Controller('attachments')
export class AttachmentsController {
  constructor(
    private readonly chatAccess: ChatAccessService,
    private readonly attachments: AttachmentsService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${randomUUID()}-${safeName}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!isAllowedMimeType(file.mimetype, file.originalname)) {
          cb(
            new BadRequestException(
              `File type not allowed: ${file.mimetype || 'unknown'}`,
            ) as unknown as Error,
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!isAllowedMimeType(file.mimetype, file.originalname)) {
      throw new BadRequestException(`File type not allowed: ${file.mimetype || 'unknown'}`);
    }

    const url = `/uploads/${file.filename}`;
    this.attachments.rememberPendingUpload(file.filename, user.id);

    return {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      url,
    };
  }

  /** Authenticated download — replaces public static /uploads/. */
  @Get('file/:filename')
  async download(
    @Param('filename') filename: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const safe = basename(filename);
    if (!safe || safe !== filename || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }

    const url = `/uploads/${safe}`;
    await this.assertDownloadAccess(user, url, safe);

    const filePath = join(UPLOAD_DIR, safe);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }

  @Get(':id/access')
  async verifyAccess(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const attachment = await this.chatAccess.assertAttachmentAccess(user, id);
    return { allowed: true, attachmentId: attachment.id };
  }

  private async assertDownloadAccess(user: RequestUser, url: string, filename: string) {
    if (this.attachments.canAccessPendingUpload(filename, user.id)) {
      return;
    }

    try {
      await this.chatAccess.assertAttachmentAccess(user, url);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw new ForbiddenException('You do not have access to this file');
      }
      throw err;
    }
  }
}

/** Legacy path compatibility: GET /uploads/:filename with mock identity headers/query. */
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly chatAccess: ChatAccessService,
    private readonly attachments: AttachmentsService,
  ) {}

  @Get(':filename')
  async download(
    @Param('filename') filename: string,
    @CurrentUser() user: RequestUser,
    @Query('x-user-id') queryUserId: string | undefined,
    @Query('x-workplace-id') queryWorkplaceId: string | undefined,
    @Res() res: Response,
  ) {
    const effectiveUser: RequestUser = {
      ...user,
      id: queryUserId?.trim() || user.id,
      userId: queryUserId?.trim() || user.userId,
      workplaceId: queryWorkplaceId?.trim() || user.workplaceId,
    };

    const safe = basename(filename);
    if (!safe || safe !== filename || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }

    const url = `/uploads/${safe}`;
    if (!this.attachments.canAccessPendingUpload(safe, effectiveUser.id)) {
      try {
        await this.chatAccess.assertAttachmentAccess(effectiveUser, url);
      } catch {
        throw new ForbiddenException('You do not have access to this file');
      }
    }

    const filePath = join(UPLOAD_DIR, safe);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }
}
