import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class MeetingNotesDto {
  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  parentMessageId?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  transcript?: string;

  @IsBoolean()
  @IsOptional()
  postAsMessage?: boolean;
}
