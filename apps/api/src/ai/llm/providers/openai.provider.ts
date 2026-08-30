import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProvider } from '../llm-provider.interface';
import type { ChatTurn, LlmCompletionOptions } from '../llm.types';

/**
 * Production stub — implement with the OpenAI SDK when OPENAI_API_KEY is supplied.
 * Feature services should keep calling LlmService; flip AI_PROVIDER=openai to enable.
 */
@Injectable()
export class OpenAiProvider implements LlmProvider {
  readonly id = 'openai' as const;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY')?.trim());
  }

  model(): string {
    return this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4.1-mini';
  }

  async complete(
    _messages: ChatTurn[],
    _options: LlmCompletionOptions = {},
  ): Promise<string> {
    throw new Error(
      'OpenAI provider is not implemented yet. Set AI_PROVIDER=gemini for now, or implement OpenAiProvider with OPENAI_API_KEY.',
    );
  }
}
