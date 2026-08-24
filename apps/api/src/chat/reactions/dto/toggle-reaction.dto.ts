import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  userName?: string;
}
