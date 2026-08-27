import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Hash,
  Lock,
  Loader2,
  MessageSquare,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { chatService } from '../../services';
import { Avatar } from '../ui';
import { formatTimestamp } from '../../utils';
import { Channel, Message, User } from '@team-chat/shared';

type SearchScope = 'all' | 'channels' | 'people' | 'messages';

interface SearchResults {
  channels: Channel[];
  users: User[];
  messages: Message[];
}

type NavItem =
  | { kind: 'channel'; id: string }
  | { kind: 'user'; id: string }
  | { kind: 'message'; id: string; channelId?: string; conversationId?: string };

const SCOPES: { id: SearchScope; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Everything' },
  { id: 'channels', label: 'Channels', hint: 'Try #name' },
  { id: 'people', label: 'People', hint: 'Try @name' },
  { id: 'messages', label: 'Messages', hint: 'Message text' },
];

function stripPrefix(raw: string): { scopeHint?: SearchScope; q: string } {
  const t = raw.trim();
  if (t.startsWith('#')) return { scopeHint: 'channels', q: t.slice(1).trim() };
  if (t.startsWith('@')) return { scopeHint: 'people', q: t.slice(1).trim() };
  return { q: t };
}

export const SearchModal: React.FC = () => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [results, setResults] = useState<SearchResults>({
    channels: [],
    users: [],
    messages: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchModalOpen,
    setSearchModalOpen,
    setActiveChannel,
    jumpToMessage,
  } = useUiStore();
  const { channels, users } = useWorkspace();
  const { createConversation } = useChatMutations();

  const people = useMemo(
    () => users.filter((u) => !u.id.startsWith('usr-agent-')),
    [users],
  );

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];
    const showChannels = scope === 'all' || scope === 'channels';
    const showPeople = scope === 'all' || scope === 'people';
    const showMessages = scope === 'all' || scope === 'messages';
    if (showChannels) for (const c of results.channels) items.push({ kind: 'channel', id: c.id });
    if (showPeople) for (const u of results.users) items.push({ kind: 'user', id: u.id });
    if (showMessages)
      for (const m of results.messages.slice(0, 12)) {
        items.push({
          kind: 'message',
          id: m.id,
          channelId: m.channelId,
          conversationId: m.conversationId,
        });
      }
    return items;
  }, [results, scope]);

  const activateNavItem = useCallback(
    (item: NavItem) => {
      if (item.kind === 'channel') {
        setActiveChannel(item.id);
        setSearchModalOpen(false);
        return;
      }
      if (item.kind === 'user') {
        createConversation.mutate(item.id);
        setSearchModalOpen(false);
        return;
      }
      jumpToMessage({
        messageId: item.id,
        channelId: item.channelId,
        conversationId: item.conversationId,
      });
      setSearchModalOpen(false);
    },
    [createConversation, jumpToMessage, setActiveChannel, setSearchModalOpen],
  );

  const doSearch = useCallback(
    async (raw: string, nextScope: SearchScope) => {
      const { scopeHint, q } = stripPrefix(raw);
      const effectiveScope = scopeHint ?? nextScope;

      if (!q) {
        setResults({
          channels: effectiveScope === 'people' || effectiveScope === 'messages' ? [] : channels.slice(0, 6),
          users: effectiveScope === 'channels' || effectiveScope === 'messages' ? [] : people.slice(0, 6),
          messages: [],
        });
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      try {
        const data = await chatService.search(raw.trim(), effectiveScope);
        setResults({
          channels: data.channels,
          users: data.users.filter((u) => !u.id.startsWith('usr-agent-')),
          messages: data.messages,
        });
      } catch {
        const lower = q.toLowerCase();
        setResults({
          channels:
            effectiveScope === 'people' || effectiveScope === 'messages'
              ? []
              : channels.filter(
                  (c) =>
                    c.name.toLowerCase().includes(lower) ||
                    c.description?.toLowerCase().includes(lower),
                ),
          users:
            effectiveScope === 'channels' || effectiveScope === 'messages'
              ? []
              : people.filter(
                  (u) =>
                    u.name.toLowerCase().includes(lower) ||
                    u.title?.toLowerCase().includes(lower),
                ),
          messages: [],
        });
        setSearchError('Showing local results — live search unavailable.');
      } finally {
        setIsSearching(false);
      }
    },
    [channels, people],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      }
      if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  useEffect(() => {
    if (!searchModalOpen) return;
    const timer = setTimeout(() => void doSearch(query, scope), 220);
    return () => clearTimeout(timer);
  }, [query, scope, searchModalOpen, doSearch]);

  useEffect(() => {
    if (searchModalOpen) {
      setQuery('');
      setScope('all');
      setResults({ channels: channels.slice(0, 6), users: people.slice(0, 6), messages: [] });
      setSearchError(null);
      setActiveResultIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchModalOpen]);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [query, scope, results]);

  if (!searchModalOpen) return null;

  const { scopeHint } = stripPrefix(query);
  const displayScope = scopeHint ?? scope;
  const showChannels =
    (displayScope === 'all' || displayScope === 'channels') && results.channels.length > 0;
  const showPeople =
    (displayScope === 'all' || displayScope === 'people') && results.users.length > 0;
  const showMessages =
    (displayScope === 'all' || displayScope === 'messages') && results.messages.length > 0;
  const hasResults = showChannels || showPeople || showMessages;
  const emptyQuery = !stripPrefix(query).q;

  let runningIndex = 0;
  const indexFor = () => {
    const i = runningIndex;
    runningIndex += 1;
    return i;
  };

  const rowActive = (idx: number) =>
    activeResultIndex === idx
      ? { background: 'var(--color-accent-muted)', outline: '1px solid var(--color-active-border)' }
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={() => setSearchModalOpen(false)}
      />

      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95"
        style={{ background: 'var(--color-modal)', border: '1px solid var(--color-border)' }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: 'var(--color-accent)' }} />
          ) : (
            <Search className="h-5 w-5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
          )}
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (navItems.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveResultIndex((i) => (i + 1) % navItems.length);
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveResultIndex((i) => (i <= 0 ? navItems.length - 1 : i - 1));
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                const item = navItems[Math.max(0, activeResultIndex)];
                if (item) activateNavItem(item);
              }
            }}
            placeholder="Search — use # for channels, @ for people"
            className="w-full bg-transparent text-[15px] focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close search"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scope chips */}
        <div
          className="flex flex-wrap items-center gap-1.5 px-3 py-2"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          {SCOPES.map((s) => {
            const active = !scopeHint && scope === s.id;
            return (
              <button
                key={s.id}
                type="button"
                title={s.hint}
                onClick={() => setScope(s.id)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: active ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  border: `1px solid ${active ? 'var(--color-active-border)' : 'var(--color-border)'}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
          {scopeHint && (
            <span className="ml-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Filtering by {scopeHint === 'channels' ? '#' : '@'}…
            </span>
          )}
        </div>

        {searchError && (
          <div
            className="px-4 py-2 text-[11px]"
            style={{
              color: 'var(--color-warning, #fbbf24)',
              background: 'rgba(251,191,36,0.08)',
            }}
          >
            {searchError}
          </div>
        )}

        <div className="max-h-[min(28rem,60vh)] space-y-3 overflow-y-auto p-2.5">
          {emptyQuery && (
            <p className="px-2 pb-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Tip: type to search, or start with <strong>#</strong> / <strong>@</strong>. ↑↓ Enter to
              open.
            </p>
          )}

          {showChannels && (
            <section>
              <p
                className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Channels
              </p>
              <div className="space-y-0.5">
                {results.channels.map((channel) => {
                  const idx = indexFor();
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => activateNavItem({ kind: 'channel', id: channel.id })}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover-surface"
                      style={rowActive(idx)}
                    >
                      {channel.type === 'private' ? (
                        <Lock className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                      ) : (
                        <Hash className="h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {channel.name}
                      </span>
                      {channel.description && (
                        <span className="hidden max-w-[40%] truncate text-[11px] sm:inline" style={{ color: 'var(--color-text-tertiary)' }}>
                          {channel.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {showPeople && (
            <section>
              <p
                className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                People
              </p>
              <div className="space-y-0.5">
                {results.users.map((u) => {
                  const idx = indexFor();
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => activateNavItem({ kind: 'user', id: u.id })}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover-surface"
                      style={rowActive(idx)}
                    >
                      <Avatar name={u.name} src={u.avatarUrl} size="xs" status={u.status} showStatus />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {u.name}
                        </p>
                        {u.title && (
                          <p className="truncate text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                            {u.title}
                          </p>
                        )}
                      </div>
                      <UserIcon className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {showMessages && (
            <section>
              <p
                className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Messages
              </p>
              <div className="space-y-0.5">
                {results.messages.slice(0, 12).map((msg) => {
                  const idx = indexFor();
                  const where =
                    (msg as Message & { channelName?: string }).channelName
                      ? `#${(msg as Message & { channelName?: string }).channelName}`
                      : 'Direct message';
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() =>
                        activateNavItem({
                          kind: 'message',
                          id: msg.id,
                          channelId: msg.channelId,
                          conversationId: msg.conversationId,
                        })
                      }
                      className="flex w-full flex-col gap-0.5 rounded-xl px-2.5 py-2 text-left transition-colors hover-surface"
                      style={rowActive(idx)}
                    >
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {msg.senderName}
                        </span>
                        <span className="truncate">{where}</span>
                        <span className="ml-auto shrink-0">{formatTimestamp(msg.createdAt)}</span>
                      </div>
                      <p className="line-clamp-2 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {msg.content}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {!emptyQuery && !isSearching && !hasResults && (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              No results for “{stripPrefix(query).q}”
              <p className="mt-1 text-[11px]">Try another word, or switch All / Channels / People / Messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
