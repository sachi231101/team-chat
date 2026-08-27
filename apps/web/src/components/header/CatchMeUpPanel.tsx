import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Copy,
  Check,
  Send,
  ArrowUpRight,
} from 'lucide-react';
import { chatService } from '../../services';
import { useUiStore } from '../../stores';

type WindowId = 'unread' | '24h' | '7d';

export type CatchMeUpCitation = {
  index: number;
  messageId: string;
  senderName: string;
  content: string;
  channelId?: string;
  conversationId?: string;
  createdAt: string;
};

interface CatchMeUpPanelProps {
  open: boolean;
  onClose: () => void;
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
  title?: string;
}

const WINDOWS: { id: WindowId; label: string; hint: string }[] = [
  { id: 'unread', label: 'Unread', hint: 'Since you last caught up' },
  { id: '24h', label: 'Last 24 hours', hint: 'Recent activity' },
  { id: '7d', label: 'Last 7 days', hint: 'Broader catch-up' },
];

function renderSummaryWithCitations(
  summary: string,
  citations: CatchMeUpCitation[],
  onCite: (c: CatchMeUpCitation) => void,
) {
  const parts = summary.split(/(\[\d+\])/g);
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

export const CatchMeUpPanel: React.FC<CatchMeUpPanelProps> = ({
  open,
  onClose,
  channelId,
  conversationId,
  parentMessageId,
  title = 'Catch me up',
}) => {
  const setError = useUiStore((s) => s.setError);
  const jumpToMessage = useUiStore((s) => s.jumpToMessage);

  const [windowId, setWindowId] = useState<WindowId>('unread');
  const [busy, setBusy] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [citations, setCitations] = useState<CatchMeUpCitation[]>([]);

  useEffect(() => {
    if (!open) return;
    setSummary(null);
    setCitations([]);
    setCopied(false);
    setWindowId('unread');
    if (channelId || conversationId || parentMessageId) {
      void (async () => {
        setBusy(true);
        try {
          const result = await chatService.summarizeWithAi({
            window: 'unread',
            channelId,
            conversationId,
            parentMessageId,
            postAsMessage: false,
          });
          setSummary(result.summary);
          setCitations(result.citations ?? []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Catch-up failed');
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [open, channelId, conversationId, parentMessageId, setError]);

  const canRun = Boolean(channelId || conversationId || parentMessageId);

  const windowLabel = useMemo(
    () => WINDOWS.find((w) => w.id === windowId)?.label ?? windowId,
    [windowId],
  );

  const run = async (id: WindowId = windowId) => {
    if (!canRun) {
      setError('Select a channel or conversation first');
      return;
    }
    setBusy(true);
    setSummary(null);
    setCitations([]);
    try {
      const result = await chatService.summarizeWithAi({
        window: id,
        channelId,
        conversationId,
        parentMessageId,
        postAsMessage: false,
      });
      setSummary(result.summary);
      setCitations(result.citations ?? []);
      setWindowId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Catch-up failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handlePost = async () => {
    if (!canRun || !summary) return;
    setPosting(true);
    try {
      await chatService.summarizeWithAi({
        window: windowId,
        channelId,
        conversationId,
        parentMessageId,
        postAsMessage: true,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post summary');
    } finally {
      setPosting(false);
    }
  };

  const handleCite = (c: CatchMeUpCitation) => {
    jumpToMessage({
      messageId: c.messageId,
      channelId: c.channelId,
      conversationId: c.conversationId,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close catch me up"
        onClick={onClose}
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        style={{
          background: 'var(--color-elevated)',
          borderLeft: '1px solid var(--color-border)',
        }}
        role="dialog"
        aria-labelledby="catch-me-up-title"
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
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="catch-me-up-title"
                className="text-sm font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </h2>
              <p className="text-[11px] leading-snug" style={{ color: 'var(--color-text-tertiary)' }}>
                AI summary of this chat. Citations jump to the source message.
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
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Time range
          </p>
          <div className="flex flex-wrap gap-1.5">
            {WINDOWS.map((w) => {
              const active = windowId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setWindowId(w.id);
                    void run(w.id);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-text-primary)',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}
                  title={w.hint}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!canRun && (
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Open a channel or DM to catch up.
            </p>
          )}

          {busy && (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Reading recent messages…
              </p>
            </div>
          )}

          {!busy && !summary && canRun && (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Pick a time range to generate a catch-up.
              </p>
              <button
                type="button"
                onClick={() => void run()}
                className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                Catch me up · {windowLabel}
              </button>
            </div>
          )}

          {!busy && summary && (
            <div className="space-y-4">
              <div
                className="rounded-xl p-3.5 text-[13px] leading-relaxed"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {renderSummaryWithCitations(summary, citations, handleCite)}
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
                    {citations.slice(0, 8).map((c) => (
                      <li key={c.messageId}>
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

        {summary && !busy && (
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
              disabled={posting || !canRun}
              onClick={() => void handlePost()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Post to chat
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold hover-surface"
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
