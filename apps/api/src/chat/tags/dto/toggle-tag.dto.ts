import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { MessageTagType } from '@team-chat/shared';

export class ToggleTagDto {
  @IsEnum(['DECISION', 'KEY_TAKEAWAY', 'ANNOUNCEMENT', 'FOLLOW_UP'])
  tag: MessageTagType;

  @IsString()
  @IsOptional()
  note?: string;
}
