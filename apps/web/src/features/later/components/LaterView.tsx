import React, { useState } from 'react';
import { Bookmark, Pin, MessageSquare, ExternalLink } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations, useSavedMessagesQuery, usePinnedMessagesQuery } from '../../../hooks';
import { Avatar } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';

export const LaterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pinned' | 'saved'>('pinned');
  const { setActiveChannel, openThread } = useUiStore();
  const { channels } = useWorkspace();
  const { togglePin, toggleSave } = useChatMutations();
  const savedQuery = useSavedMessagesQuery();
  const pinnedQuery = usePinnedMessagesQuery();

  const pinnedMessages = pinnedQuery.data ?? [];
  const savedMessages = savedQuery.data ?? [];
  const items = activeTab === 'pinned' ? pinnedMessages : savedMessages;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Later & Pinned
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)' }}
          >
            {items.length} items
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 px-6 py-2"
        style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-header)' }}
      >
        <button
          onClick={() => setActiveTab('pinned')}
          className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'pinned' ? 'var(--color-accent-muted)' : 'transparent',
            color: activeTab === 'pinned' ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
            border: activeTab === 'pinned' ? '1px solid var(--color-active-border)' : '1px solid transparent',
          }}
        >
          <Pin className="h-3.5 w-3.5" />
          <span>Pinned ({pinnedMessages.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'saved' ? 'var(--color-accent-muted)' : 'transparent',
            color: activeTab === 'saved' ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
            border: activeTab === 'saved' ? '1px solid var(--color-active-border)' : '1px solid transparent',
          }}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span>Saved ({savedMessages.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bookmark className="h-12 w-12 opacity-30 mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              No {activeTab} items yet
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Pin or bookmark important messages to reference them here.
            </p>
          </div>
        ) : (
          items.map((msg) => {
            const channel = channels.find((c) => c.id === msg.channelId);
            return (
              <div
                key={msg.id}
                className="group relative rounded-xl p-4 transition-all shadow-sm flex flex-col gap-2.5"
                style={{
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={msg.senderName} src={msg.senderAvatar} size="xs" />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {msg.senderName}
                    </span>
                    {channel && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-accent)' }}
                      >
                        #{channel.name}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {channel && (
                      <button
                        onClick={() => setActiveChannel(channel.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Jump</span>
                      </button>
                    )}
                    <button
                      onClick={() => openThread(msg.id)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Thread</span>
                    </button>
                    {activeTab === 'pinned' ? (
                      <button
                        onClick={() => togglePin.mutate(msg.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                        style={{ color: '#f59e0b' }}
                      >
                        <Pin className="h-3 w-3 fill-current" />
                        <span>Unpin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleSave.mutate(msg.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                        style={{ color: '#a78bfa' }}
                      >
                        <Bookmark className="h-3 w-3 fill-current" />
                        <span>Unsave</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed pl-7" style={{ color: 'var(--color-text-secondary)' }}>
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
