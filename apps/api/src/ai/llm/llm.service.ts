import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProvider } from './llm-provider.interface';
import type {
  ChatTurn,
  LlmCompletionOptions,
  LlmProviderId,
  LlmStatus,
} from './llm.types';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly providers: Record<LlmProviderId, LlmProvider>;

  constructor(
    private readonly config: ConfigService,
    gemini: GeminiProvider,
    openai: OpenAiProvider,
    anthropic: AnthropicProvider,
  ) {
    this.providers = {
      gemini,
      openai,
      anthropic,
    };
  }

  isEnabled(): boolean {
    const flag = this.config.get<string>('AI_ENABLED');
    const enabled =
      flag === undefined || flag === '' || flag === 'true' || flag === '1';
    return enabled && this.activeProvider().isConfigured();
  }

  status(): LlmStatus {
    const provider = this.activeProvider();
    return {
      enabled: this.isEnabled(),
      provider: provider.id,
      model: provider.model(),
      configured: provider.isConfigured(),
      availableProviders: (Object.keys(this.providers) as LlmProviderId[]).filter(
        (id) => this.providers[id].isConfigured() || id === provider.id,
      ),
    };
  }

  async complete(
    messages: ChatTurn[],
    options: LlmCompletionOptions = {},
  ): Promise<string> {
    const provider = this.activeProvider();
    if (!provider.isConfigured()) {
      throw new Error(
        `AI is not configured (missing credentials for provider "${provider.id}")`,
      );
    }
    return provider.complete(messages, options);
  }

  private activeProvider(): LlmProvider {
    const raw = (
      this.config.get<string>('AI_PROVIDER')?.trim().toLowerCase() || 'gemini'
    ) as LlmProviderId;

    const provider = this.providers[raw];
    if (!provider) {
      this.logger.warn(
        `Unknown AI_PROVIDER="${raw}"; falling back to gemini`,
      );
      return this.providers.gemini;
    }
    return provider;
  }
}
