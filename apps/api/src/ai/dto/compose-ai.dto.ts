import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const COMPOSE_ACTIONS = [
  'improve',
  'shorten',
  'expand',
  'translate',
  'summarize',
  'casual',
  'exec',
] as const;

export type ComposeAction = (typeof COMPOSE_ACTIONS)[number];

export class ComposeAiDto {
  @IsIn(COMPOSE_ACTIONS)
  action: ComposeAction;

  @IsString()
  @MinLength(1)
  text: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  parentMessageId?: string;
}
