import React from 'react';
import { Pin, MessageSquare } from 'lucide-react';
import { useContextPinnedMessagesQuery, useChatMutations } from '../../../hooks';
import { useUiStore } from '../../../stores';
import { Avatar } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';

export const ChannelPinnedPanel: React.FC = () => {
  const { openThread } = useUiStore();
  const { togglePin } = useChatMutations();
  const pinnedQuery = useContextPinnedMessagesQuery();
  const pinnedMessages = pinnedQuery.data ?? [];

  if (pinnedQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Loading pinned messages…
      </div>
    );
  }

  if (pinnedMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Pin className="mb-3 h-12 w-12 opacity-30" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          No pinned messages yet
        </p>
        <p className="mt-1 max-w-sm text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Pin important messages from this channel or conversation to keep them easy to find.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {pinnedMessages.map((msg) => (
        <div
          key={msg.id}
          className="group rounded-xl p-4 shadow-sm"
          style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={msg.senderName} src={msg.senderAvatar} size="xs" />
              <span className="truncate text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {msg.senderName}
              </span>
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                {formatTimestamp(msg.createdAt)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => openThread(msg.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                style={{ color: 'var(--color-accent)' }}
              >
                <MessageSquare className="h-3 w-3" />
                <span>Thread</span>
              </button>
              <button
                type="button"
                onClick={() => togglePin.mutate(msg.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                style={{ color: '#f59e0b' }}
              >
                <Pin className="h-3 w-3 fill-current" />
                <span>Unpin</span>
              </button>
            </div>
          </div>
          <p className="pl-7 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {msg.content}
          </p>
        </div>
      ))}
    </div>
  );
};
