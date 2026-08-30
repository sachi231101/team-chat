import type { ChatTurn, LlmCompletionOptions, LlmProviderId } from './llm.types';

export interface LlmProvider {
  readonly id: LlmProviderId;
  isConfigured(): boolean;
  model(): string;
  complete(messages: ChatTurn[], options?: LlmCompletionOptions): Promise<string>;
}
