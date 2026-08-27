import React from 'react';
import { HelpCircle, Keyboard, Search, MessageCircleQuestion, Bot, X } from 'lucide-react';

export interface HelpPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ label: string; keys: string }> = [
  { label: 'Search', keys: 'Ctrl K' },
  { label: 'Send message', keys: 'Enter' },
  { label: 'New line', keys: 'Shift Enter' },
  { label: 'Close panel / modal', keys: 'Esc' },
];

const TIPS: Array<{ icon: React.ReactNode; title: string; body: string }> = [
  {
    icon: <Search className="h-3.5 w-3.5" />,
    title: 'Search',
    body: 'Find channels, people, and messages. Use # or @ to narrow the scope.',
  },
  {
    icon: <MessageCircleQuestion className="h-3.5 w-3.5" />,
    title: 'Ask AI',
    body: 'Ask questions about this chat or your workspace from the channel header.',
  },
  {
    icon: <Bot className="h-3.5 w-3.5" />,
    title: 'WorkspaceAgent',
    body: 'Open the agent from the top bar to chat with your AI teammate.',
  },
];

export const HelpPopover: React.FC<HelpPopoverProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-9 z-50 w-80 sm:w-96 rounded-2xl border p-4 shadow-2xl animate-in fade-in zoom-in-95"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="flex items-center justify-between border-b pb-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Help
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close help"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-4">
          <div>
            <div
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Keyboard className="h-3.5 w-3.5" />
              Keyboard shortcuts
            </div>
            <div className="grid gap-1.5">
              {SHORTCUTS.map(({ label, keys }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs"
                  style={{ background: 'var(--color-elevated)' }}
                >
                  <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                  <kbd
                    className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{
                      background: 'var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="mb-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Tips
            </div>
            <div className="space-y-2">
              {TIPS.map((tip) => (
                <div key={tip.title} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: 'var(--color-accent-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {tip.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {tip.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {tip.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
