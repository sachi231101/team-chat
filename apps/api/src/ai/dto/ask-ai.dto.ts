import { IsOptional, IsString, MinLength } from 'class-validator';

export class AskAiDto {
  @IsString()
  @MinLength(2)
  question: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}
