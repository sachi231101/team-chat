import { mapGeminiMessages } from './providers/gemini.provider';
import type { ChatTurn } from './llm.types';

describe('mapGeminiMessages', () => {
  it('maps system turns to systemInstruction and user text to the last turn', () => {
    const messages: ChatTurn[] = [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ];

    const mapped = mapGeminiMessages(messages);
    expect(mapped.systemInstruction).toBe('You are helpful.');
    expect(mapped.history).toEqual([]);
    expect(mapped.lastUserText).toBe('Hello');
  });

  it('builds chat history with model role for assistant turns', () => {
    const messages: ChatTurn[] = [
      { role: 'system', content: 'System' },
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'Reply' },
      { role: 'user', content: 'Second' },
    ];

    const mapped = mapGeminiMessages(messages);
    expect(mapped.history).toEqual([
      { role: 'user', parts: [{ text: 'First' }] },
      { role: 'model', parts: [{ text: 'Reply' }] },
    ]);
    expect(mapped.lastUserText).toBe('Second');
  });

  it('drops leading assistant history so Gemini history starts with user', () => {
    const messages: ChatTurn[] = [
      { role: 'assistant', content: 'Prior' },
      { role: 'user', content: 'Next' },
    ];

    const mapped = mapGeminiMessages(messages);
    expect(mapped.history).toEqual([]);
    expect(mapped.lastUserText).toBe('Next');
  });
});
