import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @IsIn(['online', 'busy', 'away', 'offline'])
  status?: 'online' | 'busy' | 'away' | 'offline';

  @IsString()
  @IsOptional()
  statusMessage?: string;
}
