import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import type { ActionItemStatus } from '@team-chat/shared';

export class CreateActionItemDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  @IsOptional()
  status?: ActionItemStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}
