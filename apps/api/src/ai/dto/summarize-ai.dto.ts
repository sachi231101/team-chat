import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { SUMMARIZE_WINDOWS, type SummarizeWindow } from '../ai.constants';

export class SummarizeAiDto {
  @IsIn(SUMMARIZE_WINDOWS)
  window: SummarizeWindow;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  parentMessageId?: string;

  @IsBoolean()
  @IsOptional()
  postAsMessage?: boolean;

  @IsBoolean()
  @IsOptional()
  pin?: boolean;
}
