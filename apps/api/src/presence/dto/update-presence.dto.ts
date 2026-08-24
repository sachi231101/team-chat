import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdatePresenceDto {
  @IsString()
  @IsIn(['online', 'busy', 'away', 'offline'])
  status: 'online' | 'busy' | 'away' | 'offline';

  @IsString()
  @IsOptional()
  statusMessage?: string;
}
