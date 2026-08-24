import React, { useEffect, useRef } from 'react';
import { Hash, Lock, User as UserIcon } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useActiveMessages, useChatMutations } from '../../../hooks';
import { MessageItem } from './MessageItem';
import { formatDateDivider } from '../../../utils';

export const MessageTimeline: React.FC = () => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastReadCaptured = useRef<string | null>(null);

  const { activeId, activeType, typingUsers } = useUiStore();
  const { channels, conversations, users, currentUser } = useWorkspace();
  const { messages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, lastReadMessageId } =
    useActiveMessages();
  const { markRead } = useChatMutations();

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
  const currentMessages = messages.filter((m) => !m.parentMessageId);

  useEffect(() => {
    lastReadCaptured.current = lastReadMessageId;
  }, [activeId, lastReadMessageId]);

  useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [activeId, currentMessages.length]);

  useEffect(() => {
    const latest = currentMessages[currentMessages.length - 1];
    if (!latest) return;
    const t = setTimeout(() => {
      markRead.mutate(latest.id);
    }, 800);
    return () => clearTimeout(t);
  }, [activeId, currentMessages[currentMessages.length - 1]?.id]);

  const firstUnreadIndex = currentMessages.findIndex((m, idx) => {
    if (!lastReadCaptured.current) return false;
    const lastIdx = currentMessages.findIndex((msg) => msg.id === lastReadCaptured.current);
    return lastIdx >= 0 && idx === lastIdx + 1;
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
      ref={scrollerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden"
      style={{ background: 'var(--color-main)' }}
      onScroll={(e) => {
        const el = e.currentTarget;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      }}
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
              {otherUser.id === currentUser.id ? `${otherUser.name} (you)` : otherUser.name}
            </h1>
            <p className="text-sm max-w-xl leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {otherUser.id === currentUser.id
                ? 'This is your space for notes, drafts, and anything you want to keep handy. Only you can see these messages.'
                : (
                  <>
                    This is the very beginning of your direct message history with{' '}
                    <strong style={{ color: 'var(--color-text-primary)' }}>{otherUser.name}</strong>. Messages here are private between the two of you.
                  </>
                )}
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Message Groups ───────────────────────────────── */}
      <div className="pb-4">
        {isFetchingNextPage && (
          <div className="py-2 text-center text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Loading older messages…
          </div>
        )}
        {isLoading ? (
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
