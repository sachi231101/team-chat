import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsIn(['public', 'private'])
  type: 'public' | 'private';

  @IsString()
  @IsOptional()
  createdById?: string;

  @IsString()
  @IsOptional()
  workplaceId?: string;
}
