import React, { useState } from 'react';
import { Bookmark, Pin, MessageSquare, ExternalLink, Lightbulb, CheckCircle2, Tag } from 'lucide-react';
import { useChatDataStore } from '../../../stores';
import { Avatar } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';

export const LaterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pinned' | 'saved' | 'decisions'>('pinned');
  const {
    messages,
    channels,
    togglePin,
    toggleSaveMessage,
    savedMessageIds,
    savedDecisions,
    openThread,
    setActiveChannel,
  } = useChatDataStore();

  const pinnedMessages = messages.filter((m) => m.pinned);
  const savedMessages = messages.filter((m) => savedMessageIds.includes(m.id));

  const displayCount =
    activeTab === 'pinned'
      ? pinnedMessages.length
      : activeTab === 'saved'
      ? savedMessages.length
      : savedDecisions.length;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      {/* Header */}
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Later, Pinned & Decisions
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)' }}
          >
            {displayCount} items
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-2 px-6 py-2"
        style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-header)' }}
      >
        <button
          onClick={() => setActiveTab('pinned')}
          className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'pinned' ? 'var(--color-accent-muted)' : 'transparent',
            color: activeTab === 'pinned' ? '#ffffff' : 'var(--color-text-secondary)',
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
            color: activeTab === 'saved' ? '#ffffff' : 'var(--color-text-secondary)',
            border: activeTab === 'saved' ? '1px solid var(--color-active-border)' : '1px solid transparent',
          }}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span>Saved ({savedMessages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'decisions' ? 'var(--color-accent-muted)' : 'transparent',
            color: activeTab === 'decisions' ? '#ffffff' : 'var(--color-text-secondary)',
            border: activeTab === 'decisions' ? '1px solid var(--color-active-border)' : '1px solid transparent',
          }}
        >
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          <span>Decisions Log ({savedDecisions.length})</span>
        </button>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {/* Tab 1: Decisions */}
        {activeTab === 'decisions' && (
          savedDecisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lightbulb className="h-12 w-12 opacity-30 mb-2 text-amber-400" />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                No decisions logged yet
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Click &ldquo;Save as decision&rdquo; in any message menu to log team decisions here.
              </p>
            </div>
          ) : (
            savedDecisions.map((dec) => {
              const srcMsg = messages.find((m) => m.id === dec.messageId);
              const channel = srcMsg ? channels.find((c) => c.id === srcMsg.channelId) : null;

              return (
                <div
                  key={dec.id}
                  className="rounded-xl p-4 transition-all shadow-sm flex flex-col gap-2.5 border"
                  style={{
                    background: 'var(--color-elevated)',
                    borderColor: 'rgba(245,158,11,0.25)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {dec.title}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {formatTimestamp(dec.createdAt)}
                    </span>
                  </div>

                  {srcMsg && (
                    <p className="text-xs text-slate-300 pl-8 leading-relaxed italic border-l-2 border-amber-500/30">
                      &ldquo;{srcMsg.content}&rdquo; — @{srcMsg.senderName}
                    </p>
                  )}

                  <div className="flex items-center justify-between pl-8 pt-1">
                    <div className="flex items-center gap-1.5">
                      {dec.tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                          <Tag className="h-2.5 w-2.5" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>

                    {channel && (
                      <button
                        onClick={() => setActiveChannel(channel.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>#{channel.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Tab 2 & 3: Pinned / Saved */}
        {activeTab !== 'decisions' && (
          (activeTab === 'pinned' ? pinnedMessages : savedMessages).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bookmark className="h-12 w-12 opacity-30 mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                No {activeTab} items yet
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Pin or bookmark important messages to reference them anytime here.
              </p>
            </div>
          ) : (
            (activeTab === 'pinned' ? pinnedMessages : savedMessages).map((msg) => {
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
                  {/* Header: Author + Channel origin + Date */}
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

                    {/* Actions */}
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
                          onClick={() => togglePin(msg.id)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                          style={{ color: '#f59e0b' }}
                          title="Unpin"
                        >
                          <Pin className="h-3 w-3 fill-current" />
                          <span>Unpin</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleSaveMessage(msg.id)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                          style={{ color: '#a78bfa' }}
                          title="Remove from saved"
                        >
                          <Bookmark className="h-3 w-3 fill-current" />
                          <span>Unsave</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Body */}
                  <p className="text-xs leading-relaxed pl-7" style={{ color: 'var(--color-text-secondary)' }}>
                    {msg.content}
                  </p>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
