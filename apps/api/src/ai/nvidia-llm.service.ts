import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type ChatTurn = { role: 'system' | 'user' | 'assistant'; content: string };

type NvidiaCompletion = OpenAI.Chat.Completions.ChatCompletion & {
  choices: Array<{
    message?: OpenAI.Chat.Completions.ChatCompletionMessage & {
      reasoning?: string;
      reasoning_content?: string;
    };
  }>;
};

type NvidiaCreateParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
  chat_template_kwargs?: { thinking: boolean; reasoning_effort: string };
};

@Injectable()
export class NvidiaLlmService {
  private readonly logger = new Logger(NvidiaLlmService.name);
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('AI_API_KEY')?.trim();
    const baseURL =
      this.config.get<string>('AI_BASE_URL')?.trim() ||
      'https://integrate.api.nvidia.com/v1';
    this.client = apiKey ? new OpenAI({ apiKey, baseURL }) : null;
  }

  isEnabled(): boolean {
    const flag = this.config.get<string>('AI_ENABLED');
    const enabled = flag === undefined || flag === '' || flag === 'true' || flag === '1';
    return enabled && Boolean(this.client);
  }

  status() {
    return {
      enabled: this.isEnabled(),
      provider: this.config.get<string>('AI_PROVIDER') || 'nvidia',
      model: this.model(),
      configured: Boolean(this.client),
    };
  }

  async complete(messages: ChatTurn[]): Promise<string> {
    if (!this.client) {
      throw new Error('AI is not configured (missing AI_API_KEY)');
    }

    const params: NvidiaCreateParams = {
      model: this.model(),
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: this.maxTokens(),
      stream: false,
      chat_template_kwargs: { thinking: true, reasoning_effort: 'high' },
    };

    const completion = (await this.client.chat.completions.create(
      params as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
    )) as NvidiaCompletion;

    const message = completion.choices[0]?.message;
    const content = message?.content?.trim() ?? '';
    if (!content) {
      this.logger.warn('NVIDIA completion returned empty content');
    }
    return content;
  }

  private model(): string {
    return (
      this.config.get<string>('AI_MODEL')?.trim() ||
      'deepseek-ai/deepseek-v4-flash-0731'
    );
  }

  private maxTokens(): number {
    const raw = Number(this.config.get<string>('AI_MAX_TOKENS'));
    if (Number.isFinite(raw) && raw > 0) return Math.min(raw, 8192);
    return 2048;
  }
}
