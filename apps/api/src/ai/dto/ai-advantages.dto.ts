import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class ExtractWorkDto {
  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  parentMessageId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsString()
  text?: string;
}

export class ApplyWorkDto {
  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsArray()
  tasks?: Array<{
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    status?: string;
  }>;

  @IsOptional()
  @IsArray()
  decisions?: Array<{
    title: string;
    rationale?: string;
    impactedAreas?: string[];
  }>;
}

export class DailyBriefingDto {
  @IsOptional()
  @IsString()
  timeframe?: 'today' | '24h' | '7d';
}

export class MultiAgentCoordinateDto {
  @IsString()
  objective!: string;

  @IsOptional()
  @IsArray()
  participatingAgents?: string[];

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class SmartRouteDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  currentChannelId?: string;
}

export class CreateDecisionDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  rationale?: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  status?: 'APPROVED' | 'UNDER_REVIEW' | 'SUPERSEDED';

  @IsOptional()
  @IsArray()
  impactedAreas?: string[];
}

export class UpdateDecisionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  rationale?: string;

  @IsOptional()
  @IsString()
  status?: 'APPROVED' | 'UNDER_REVIEW' | 'SUPERSEDED';

  @IsOptional()
  @IsArray()
  impactedAreas?: string[];
}

export class CreateCorrectionDto {
  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  originalText!: string;

  @IsString()
  correctedText!: string;

  @IsOptional()
  @IsString()
  instruction?: string;
}

export class CreateRuleDto {
  @IsString()
  rule!: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class ExecuteAgentTaskDto {
  @IsString()
  actionItemId!: string;
}
