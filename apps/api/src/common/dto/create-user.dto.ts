import { IsString, IsNotEmpty, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

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

  @IsString()
  @IsOptional()
  workplaceId?: string;
}
