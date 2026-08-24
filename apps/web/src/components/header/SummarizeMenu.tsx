import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { chatService } from '../../services';
import { useUiStore } from '../../stores';
import { Tooltip } from '../ui';

type WindowId = 'unread' | '24h' | '7d';

interface SummarizeMenuProps {
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
}

export const SummarizeMenu: React.FC<SummarizeMenuProps> = ({
  channelId,
  conversationId,
  parentMessageId,
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [postAsMessage, setPostAsMessage] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const setError = useUiStore((s) => s.setError);

  const run = async (id: WindowId) => {
    setBusy(true);
    setSummary(null);
    try {
      const result = await chatService.summarizeWithAi({
        window: id,
        channelId,
        conversationId,
        parentMessageId,
        postAsMessage,
      });
      if (!result.postedMessageId) {
        setSummary(result.summary);
      } else {
        setOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Summarize failed');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <Tooltip content="Summarize with AI" side="bottom">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setSummary(null);
          }}
          disabled={busy}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </button>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-40 mt-1 w-72 max-h-[420px] overflow-y-auto rounded-xl p-2 shadow-2xl"
            style={{ background: 'var(--color-modal)', border: '1px solid var(--color-border)' }}
          >
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Catch up
            </p>
            {([
              ['unread', 'Unread'],
              ['24h', 'Last 24 hours'],
              ['7d', 'Last 7 days'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={busy}
                className="flex w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium hover-surface"
                style={{ color: 'var(--color-text-primary)' }}
                onClick={() => void run(id)}
              >
                {label}
              </button>
            ))}
            <label className="mt-1 flex items-center gap-2 px-2.5 py-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={postAsMessage}
                onChange={(e) => setPostAsMessage(e.target.checked)}
              />
              Post summary to chat
            </label>
            {summary && (
              <div
                className="mt-2 whitespace-pre-wrap rounded-lg p-2.5 text-xs leading-relaxed"
                style={{
                  background: 'var(--color-accent-muted)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {summary}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
