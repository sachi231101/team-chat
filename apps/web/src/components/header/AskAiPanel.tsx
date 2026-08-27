import React, { useState } from 'react';
import {
  MessageCircleQuestion,
  X,
  Loader2,
  Copy,
  Check,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { chatService } from '../../services';
import { useUiStore } from '../../stores';

export type AskAiCitation = {
  index: number;
  messageId: string;
  senderName: string;
  content: string;
  channelId?: string;
  conversationId?: string;
  createdAt: string;
};

interface AskAiPanelProps {
  open: boolean;
  onClose: () => void;
  channelId?: string;
  conversationId?: string;
  initialQuestion?: string;
}

function renderAnswerWithCitations(
  answer: string,
  citations: AskAiCitation[],
  onCite: (c: AskAiCitation) => void,
) {
  const parts = answer.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = /^\[(\d+)\]$/.exec(part);
    if (!match) {
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    }
    const index = Number(match[1]);
    const citation = citations.find((c) => c.index === index);
    if (!citation) {
      return (
        <span key={i} style={{ color: 'var(--color-text-tertiary)' }}>
          {part}
        </span>
      );
    }
    return (
      <button
        key={i}
        type="button"
        onClick={() => onCite(citation)}
        className="mx-0.5 inline-flex items-center rounded px-1 py-0.5 text-[11px] font-semibold transition-colors hover-surface"
        style={{
          color: 'var(--color-accent)',
          background: 'var(--color-accent-muted)',
        }}
        title={`Jump to ${citation.senderName}`}
      >
        [{index}]
      </button>
    );
  });
}

export const AskAiPanel: React.FC<AskAiPanelProps> = ({
  open,
  onClose,
  channelId,
  conversationId,
  initialQuestion = '',
}) => {
  const setError = useUiStore((s) => s.setError);
  const jumpToMessage = useUiStore((s) => s.jumpToMessage);

  const [question, setQuestion] = useState(initialQuestion);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<AskAiCitation[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setQuestion(initialQuestion);
    setAnswer(null);
    setCitations([]);
    setCopied(false);
  }, [open, initialQuestion, channelId, conversationId]);

  const run = async () => {
    const q = question.trim();
    if (q.length < 2 || busy) return;
    setBusy(true);
    setAnswer(null);
    setCitations([]);
    try {
      const result = await chatService.askAi({
        question: q,
        channelId,
        conversationId,
      });
      setAnswer(result.answer);
      setCitations(result.citations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ask AI failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleCite = (c: AskAiCitation) => {
    jumpToMessage({
      messageId: c.messageId,
      channelId: c.channelId,
      conversationId: c.conversationId,
    });
  };

  if (!open) return null;

  const scopeHint = channelId
    ? 'Answers use workspace search, with extra context from this channel.'
    : conversationId
      ? 'Answers use workspace search, with extra context from this conversation.'
      : 'Answers use messages you can access across the workspace.';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close Ask AI"
        onClick={onClose}
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        style={{
          background: 'var(--color-elevated)',
          borderLeft: '1px solid var(--color-border)',
        }}
        role="dialog"
        aria-labelledby="ask-ai-title"
      >
        <header
          className="flex items-start justify-between gap-3 border-b px-4 py-3.5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
            >
              <MessageCircleQuestion className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="ask-ai-title"
                className="text-sm font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Ask AI
              </h2>
              <p className="text-[11px] leading-snug" style={{ color: 'var(--color-text-tertiary)' }}>
                {scopeHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
          <label className="sr-only" htmlFor="ask-ai-input">
            Question
          </label>
          <div className="flex gap-2">
            <input
              id="ask-ai-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void run();
                }
              }}
              placeholder="Ask about decisions, updates, files…"
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              autoFocus
            />
            <button
              type="button"
              disabled={busy || question.trim().length < 2}
              onClick={() => void run()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Ask
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {busy && (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Searching your accessible history…
              </p>
            </div>
          )}

          {!busy && !answer && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Ask a question to get an answer with source citations.
            </p>
          )}

          {!busy && answer && (
            <div className="space-y-4">
              <div
                className="rounded-xl p-3.5 text-[13px] leading-relaxed"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {renderAnswerWithCitations(answer, citations, handleCite)}
              </div>

              {citations.length > 0 && (
                <div>
                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Sources
                  </p>
                  <ul className="space-y-1.5">
                    {citations.slice(0, 10).map((c) => (
                      <li key={`${c.messageId}-${c.index}`}>
                        <button
                          type="button"
                          onClick={() => handleCite(c)}
                          className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover-surface"
                          style={{ border: '1px solid var(--color-border)' }}
                        >
                          <span
                            className="mt-0.5 shrink-0 rounded px-1 text-[10px] font-bold"
                            style={{
                              background: 'var(--color-accent-muted)',
                              color: 'var(--color-accent)',
                            }}
                          >
                            [{c.index}]
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-xs font-semibold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {c.senderName}
                            </span>
                            <span
                              className="block truncate text-[11px]"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              {c.content}
                            </span>
                          </span>
                          <ArrowUpRight
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {answer && !busy && (
          <footer
            className="flex items-center gap-2 border-t px-4 py-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold hover-surface"
              style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg px-2.5 py-2 text-xs font-semibold hover-surface"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Dismiss
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
};
