import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class AddChannelMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];
}
