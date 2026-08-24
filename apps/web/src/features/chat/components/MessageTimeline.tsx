import React, { useEffect, useRef, useState } from 'react';
import { Hash, Lock, User as UserIcon, Sparkles, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { useChatDataStore } from '../../../stores';
import { MessageItem } from './MessageItem';
import { formatDateDivider } from '../../../utils';

export const MessageTimeline: React.FC = () => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [catchupExpanded, setCatchupExpanded] = useState(false);

  const { activeId, activeType, channels, conversations, users, currentUser, messages, typingUsers, messagesLoading } =
    useChatDataStore();

  const currentChannel = channels.find((c) => c.id === activeId);
  const currentConversation = conversations.find((c) => c.id === activeId);
  const otherUser =
    activeType === 'conversation' && currentConversation
      ? users.find(
          (u) =>
            u.id ===
            (currentConversation.participants.find((id) => id !== currentUser.id) ||
              currentConversation.participants[0]),
        )
      : null;

  // Only non-reply messages for the active context
  const currentMessages = messages.filter((m) => {
    if (m.parentMessageId) return false;
    if (activeType === 'channel') return m.channelId === activeId;
    if (activeType === 'conversation') return m.conversationId === activeId;
    return false;
  });

  // Auto-scroll to bottom whenever messages change or active channel changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [activeId, currentMessages.length]);

  // Determine where unread messages start (show divider before first unread)
  const firstUnreadIndex = currentMessages.findIndex((m) => {
    // Consider last 2 messages as "new" for demonstration purposes
    const idx = currentMessages.indexOf(m);
    return idx === Math.max(0, currentMessages.length - 2);
  });

  // Group messages by calendar date
  const groupedMessages: { date: string; items: typeof currentMessages }[] = [];
  let lastDate = '';
  let currentGroup: typeof currentMessages = [];

  currentMessages.forEach((msg) => {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) {
      if (currentGroup.length) groupedMessages.push({ date: lastDate, items: currentGroup });
      lastDate = d;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });
  if (currentGroup.length) groupedMessages.push({ date: lastDate, items: currentGroup });

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden"
      style={{ background: 'var(--color-main)' }}
    >
      {/* ── Channel / DM Welcome Banner ─────────────────── */}
      <div
        className="px-6 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        {activeType === 'channel' && currentChannel ? (
          <div className="space-y-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(14,165,233,0.12)',
                border: '1px solid rgba(14,165,233,0.25)',
              }}
            >
              {currentChannel.type === 'private' ? (
                <Lock className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
              ) : (
                <Hash className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
              )}
            </div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Welcome to #{currentChannel.name}!
            </h1>
            <p className="text-sm max-w-xl leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              This is the very beginning of the <strong style={{ color: 'var(--color-text-primary)' }}>#{currentChannel.name}</strong> channel.{' '}
              {currentChannel.description || 'Use this channel to collaborate, share updates, and keep the team in sync.'}
            </p>
          </div>
        ) : otherUser ? (
          <div className="space-y-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(14,165,233,0.12)',
                border: '1px solid rgba(14,165,233,0.25)',
              }}
            >
              <UserIcon className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
            </div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {otherUser.name}
            </h1>
            <p className="text-sm max-w-xl leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              This is the very beginning of your direct message history with <strong style={{ color: 'var(--color-text-primary)' }}>{otherUser.name}</strong>. Messages here are private between the two of you.
            </p>
          </div>
        ) : null}

        {/* AI Daily Catchup Digest Banner for active channel */}
        {activeType === 'channel' && currentChannel && currentMessages.length > 0 && (
          <div className="mt-4 rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-950/30 via-slate-900/60 to-indigo-950/20 p-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Catch-up on #{currentChannel.name}
                  </span>
                  <span className="ml-2 text-[10px] text-slate-400">
                    {currentMessages.length} messages • AI Summary available
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCatchupExpanded(!catchupExpanded)}
                className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 px-2 py-1 text-[11px] font-semibold text-violet-300 transition-colors"
              >
                <span>{catchupExpanded ? 'Hide Digest' : 'View Digest'}</span>
                {catchupExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {catchupExpanded && (
              <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1.5 text-xs animate-in fade-in">
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Key discussions focused on architecture specifications, design system tokens, and V1 milestones.</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <ArrowRight className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{users.slice(0, 3).map((u) => u.name).join(', ')} contributed recent updates.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Message Groups ───────────────────────────────── */}
      <div className="pb-4">
        {messagesLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-accent) transparent var(--color-accent) var(--color-accent)' }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Loading messages…</span>
          </div>
        ) : groupedMessages.length === 0 ? (
          <div
            className="py-16 text-center text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            No messages yet — say something!
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="relative my-3 flex items-center px-6">
                <div className="flex-1" style={{ height: '1px', background: 'var(--color-border-subtle)' }} />
                <span
                  className="mx-3 whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {formatDateDivider(group.items[0].createdAt)}
                </span>
                <div className="flex-1" style={{ height: '1px', background: 'var(--color-border-subtle)' }} />
              </div>

              {/* Message items */}
              {group.items.map((msg) => {
                const globalIdx = currentMessages.indexOf(msg);
                const showNewDivider = globalIdx === firstUnreadIndex && globalIdx > 0;
                return (
                  <React.Fragment key={msg.id}>
                    {showNewDivider && (
                      <div className="relative my-3 flex items-center px-6">
                        <div className="flex-1" style={{ height: '1px', background: 'var(--color-accent)' }} />
                        <span
                          className="mx-3 whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: 'var(--color-accent-muted)',
                            border: '1px solid var(--color-active-border)',
                            color: '#c4b5fd',
                          }}
                        >
                          New messages
                        </span>
                        <div className="flex-1" style={{ height: '1px', background: 'var(--color-accent)' }} />
                      </div>
                    )}
                    <MessageItem message={msg} />
                  </React.Fragment>
                );
              })}
            </div>
          ))
        )}

        {/* Live typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-1.5 animate-in fade-in">
            <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 text-[11px] text-slate-400">
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="font-medium text-slate-300">
                {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};
