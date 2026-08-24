import { IsArray, ArrayNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  participants: string[];

  @IsString()
  @IsOptional()
  workplaceId?: string;
}
