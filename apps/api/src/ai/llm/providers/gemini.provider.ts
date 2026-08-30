import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LlmProvider } from '../llm-provider.interface';
import type { ChatTurn, LlmCompletionOptions } from '../llm.types';

export function mapGeminiMessages(messages: ChatTurn[]): {
  systemInstruction?: string;
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  lastUserText: string;
} {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content.trim())
    .filter(Boolean);
  const systemInstruction = systemParts.length
    ? systemParts.join('\n\n')
    : undefined;

  const nonSystem = messages.filter((m) => m.role !== 'system');
  if (nonSystem.length === 0) {
    return { systemInstruction, history: [], lastUserText: '' };
  }

  const last = nonSystem[nonSystem.length - 1];
  const prior = nonSystem.slice(0, -1);

  const history = prior.map((m) => ({
    role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: m.content }],
  }));

  // Gemini requires history to start with a user turn when present.
  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  const lastUserText =
    last.role === 'user'
      ? last.content
      : [...prior.filter((m) => m.role === 'user').map((m) => m.content), last.content]
          .filter(Boolean)
          .join('\n\n');

  return { systemInstruction, history, lastUserText };
}

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly id = 'gemini' as const;
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  model(): string {
    return (
      this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-3.6-flash'
    );
  }

  async complete(
    messages: ChatTurn[],
    options: LlmCompletionOptions = {},
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini is not configured (missing GEMINI_API_KEY)');
    }

    const modelId = options.model?.trim() || this.model();
    const { systemInstruction, history, lastUserText } =
      mapGeminiMessages(messages);

    if (!lastUserText.trim()) {
      throw new Error('Gemini completion requires at least one user message');
    }

    const generativeModel = this.client.getGenerativeModel({
      model: modelId,
      systemInstruction,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        topP: 0.95,
        maxOutputTokens: options.maxTokens ?? this.maxTokens(),
      },
    });

    try {
      const chat = generativeModel.startChat({ history });
      const result = await chat.sendMessage(lastUserText);
      let content = result.response.text()?.trim() ?? '';
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      if (!content) {
        this.logger.warn(`Gemini completion returned empty content (${modelId})`);
      }
      return content;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gemini completion failed (${modelId}): ${message}`);
      throw error instanceof Error
        ? error
        : new Error(`Gemini completion failed: ${message}`);
    }
  }

  private maxTokens(): number {
    const raw = Number(this.config.get<string>('AI_MAX_TOKENS'));
    if (Number.isFinite(raw) && raw > 0) return Math.min(raw, 8192);
    return 2048;
  }
}
