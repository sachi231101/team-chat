import { IsOptional, IsString, MinLength } from 'class-validator';

export class SummarizeFileDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
