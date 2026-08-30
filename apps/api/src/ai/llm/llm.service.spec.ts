import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import type { LlmProvider } from './llm-provider.interface';
import type { LlmProviderId } from './llm.types';

function mockProvider(
  id: LlmProviderId,
  configured: boolean,
  model = 'test-model',
): LlmProvider {
  return {
    id,
    isConfigured: () => configured,
    model: () => model,
    complete: jest.fn(async () => `${id}-ok`),
  };
}

describe('LlmService', () => {
  it('selects gemini by default and delegates complete()', async () => {
    const gemini = mockProvider('gemini', true, 'gemini-2.0-flash');
    const openai = mockProvider('openai', false);
    const anthropic = mockProvider('anthropic', false);
    const config = {
      get: (key: string) => {
        if (key === 'AI_ENABLED') return 'true';
        if (key === 'AI_PROVIDER') return undefined;
        return undefined;
      },
    } as unknown as ConfigService;

    const llm = new LlmService(
      config,
      gemini as never,
      openai as never,
      anthropic as never,
    );

    expect(llm.isEnabled()).toBe(true);
    expect(llm.status()).toMatchObject({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      configured: true,
      enabled: true,
    });
    await expect(
      llm.complete([{ role: 'user', content: 'hi' }]),
    ).resolves.toBe('gemini-ok');
  });

  it('falls back to gemini for unknown AI_PROVIDER values', async () => {
    const gemini = mockProvider('gemini', true);
    const openai = mockProvider('openai', false);
    const anthropic = mockProvider('anthropic', false);
    const config = {
      get: (key: string) => {
        if (key === 'AI_ENABLED') return 'true';
        if (key === 'AI_PROVIDER') return 'unknown-vendor';
        return undefined;
      },
    } as unknown as ConfigService;

    const llm = new LlmService(
      config,
      gemini as never,
      openai as never,
      anthropic as never,
    );

    expect(llm.status().provider).toBe('gemini');
  });
});
