export type ChatTurn = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmProviderId = 'gemini' | 'openai' | 'anthropic';

export type LlmCompletionOptions = {
  /** Optional provider-specific model override for a single request. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type LlmStatus = {
  enabled: boolean;
  provider: LlmProviderId;
  model: string;
  configured: boolean;
  availableProviders: LlmProviderId[];
};
