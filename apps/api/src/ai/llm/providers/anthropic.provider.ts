import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProvider } from '../llm-provider.interface';
import type { ChatTurn, LlmCompletionOptions } from '../llm.types';

/**
 * Production stub — implement with the Anthropic SDK when ANTHROPIC_API_KEY is supplied.
 * Feature services should keep calling LlmService; flip AI_PROVIDER=anthropic to enable.
 */
@Injectable()
export class AnthropicProvider implements LlmProvider {
  readonly id = 'anthropic' as const;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ANTHROPIC_API_KEY')?.trim());
  }

  model(): string {
    return (
      this.config.get<string>('ANTHROPIC_MODEL')?.trim() ||
      'claude-sonnet-4-20250514'
    );
  }

  async complete(
    _messages: ChatTurn[],
    _options: LlmCompletionOptions = {},
  ): Promise<string> {
    throw new Error(
      'Anthropic provider is not implemented yet. Set AI_PROVIDER=gemini for now, or implement AnthropicProvider with ANTHROPIC_API_KEY.',
    );
  }
}
