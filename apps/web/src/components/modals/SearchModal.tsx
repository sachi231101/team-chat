import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Hash, Lock, Loader2, ArrowRight, Bookmark, FileText, Bell, MessageSquare, Settings, User as UserIcon, Sparkles } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { chatService } from '../../services';
import { Avatar } from '../ui';
import { formatTimestamp } from '../../utils';
import { Channel, Message, User } from '@team-chat/shared';

interface SearchResults {
  channels: Channel[];
  users: User[];
  messages: Message[];
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

export const SearchModal: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ channels: [], users: [], messages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<'search' | 'ask'>('search');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askCitations, setAskCitations] = useState<
    {
      index: number;
      messageId: string;
      senderName: string;
      content: string;
      channelId?: string;
      conversationId?: string;
      createdAt: string;
    }[]
  >([]);
  const [isAsking, setIsAsking] = useState(false);

  const {
    searchModalOpen,
    setSearchModalOpen,
    setActiveChannel,
    setActiveConversation,
    setActiveRailTab,
    jumpToMessage,
    setProfileModalOpen,
    setSettingsModalOpen,
    activeId,
    activeType,
  } = useUiStore();
  const { channels, users } = useWorkspace();
  const { createConversation } = useChatMutations();

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'act-recap',
      title: 'Daily recap with WorkspaceAgent',
      subtitle: 'Open a DM with your personal catch-up assistant',
      icon: <Sparkles className="h-4 w-4 text-violet-400" />,
      action: () => {
        createConversation.mutate('usr-agent-workspace');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-saved',
      title: 'Jump to Later & Pinned',
      subtitle: 'View your bookmarked messages and saved decisions',
      icon: <Bookmark className="h-4 w-4 text-violet-400" />,
      action: () => {
        setActiveRailTab('later');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-files',
      title: 'Jump to Shared Files',
      subtitle: 'Browse all documents, spreadsheets, and shared media',
      icon: <FileText className="h-4 w-4 text-sky-400" />,
      action: () => {
        setActiveRailTab('files');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-activity',
      title: 'Jump to Activity Feed',
      subtitle: 'Review mentions, thread replies, and emoji reactions',
      icon: <Bell className="h-4 w-4 text-emerald-400" />,
      action: () => {
        setActiveRailTab('activity');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-dms',
      title: 'Direct Messages',
      subtitle: 'Switch to your 1:1 and small team conversations',
      icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
      action: () => {
        setActiveRailTab('dms');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-profile',
      title: 'Edit Profile & Status',
      subtitle: 'Update your avatar, role, and custom status',
      icon: <UserIcon className="h-4 w-4 text-amber-400" />,
      action: () => {
        setSearchModalOpen(false);
        setProfileModalOpen(true);
      },
    },
    {
      id: 'act-settings',
      title: 'Preferences & Themes',
      subtitle: 'Adjust dark/light theme, notification sounds, density',
      icon: <Settings className="h-4 w-4 text-theme-secondary" />,
      action: () => {
        setSearchModalOpen(false);
        setSettingsModalOpen(true);
      },
    },
  ], [setActiveRailTab, setSearchModalOpen, setProfileModalOpen, setSettingsModalOpen]);

  const matchingActions = useMemo(() => {
    const clean = query.toLowerCase().trim();
    if (!clean) return quickActions.slice(0, 3);
    return quickActions.filter((a) =>
      a.title.toLowerCase().includes(clean) ||
      a.subtitle.toLowerCase().includes(clean) ||
      clean.startsWith('/')
    );
  }, [query, quickActions]);

  // Listen for Ctrl+K or Cmd+K
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

  // Debounced backend search
  const doSearch = useCallback(async (q: string) => {
    const clean = q.trim();

    if (!clean) {
      // Empty query — show local channels & users from store as suggestions
      setResults({ channels: channels.slice(0, 5), users: users.slice(0, 5), messages: [] });
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const data = await chatService.search(clean);
      setResults(data);
    } catch {
      // Fallback: search local in-memory state when backend is unavailable
      const cleanLower = clean.toLowerCase();
      setResults({
        channels: channels.filter(
          (c) =>
            c.name.toLowerCase().includes(cleanLower) ||
            c.description?.toLowerCase().includes(cleanLower),
        ),
        users: users.filter(
          (u) =>
            u.name.toLowerCase().includes(cleanLower) ||
            u.title?.toLowerCase().includes(cleanLower),
        ),
        messages: [],
      });
      setSearchError('Live search unavailable — showing local results.');
    } finally {
      setIsSearching(false);
    }
  }, [channels, users]);

  const runAsk = useCallback(async (q: string) => {
    const clean = q.trim();
    if (!clean) {
      setAskAnswer(null);
      setAskCitations([]);
      return;
    }
    setIsAsking(true);
    setSearchError(null);
    try {
      const data = await chatService.askAi({
        question: clean,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
      });
      setAskAnswer(data.answer);
      setAskCitations(data.citations);
    } catch (err) {
      setAskAnswer(null);
      setAskCitations([]);
      setSearchError(err instanceof Error ? err.message : 'AI is unavailable.');
    } finally {
      setIsAsking(false);
    }
  }, [activeId, activeType]);

  useEffect(() => {
    if (!searchModalOpen) return;
    if (mode === 'ask') return;
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchModalOpen, doSearch, mode]);

  // Reset when opening
  useEffect(() => {
    if (searchModalOpen) {
      setQuery('');
      setResults({ channels: channels.slice(0, 5), users: users.slice(0, 5), messages: [] });
      setSearchError(null);
      setMode('search');
      setAskAnswer(null);
      setAskCitations([]);
    }
  }, [searchModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!searchModalOpen) return null;

  const hasResults =
    results.channels.length > 0 || results.users.length > 0 || results.messages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => setSearchModalOpen(false)}
      />

      {/* Search Box */}
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95"
        style={{ background: 'var(--color-modal)', border: '1px solid var(--color-border)' }}
      >
        {/* Search Input Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {isSearching || isAsking ? (
            <Loader2 className="h-5 w-5 text-indigo-400 shrink-0 animate-spin" />
          ) : mode === 'ask' ? (
            <Sparkles className="h-5 w-5 text-violet-400 shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-indigo-400 shrink-0" />
          )}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (mode === 'ask' && e.key === 'Enter') {
                e.preventDefault();
                void runAsk(query);
              }
            }}
            placeholder={
              mode === 'ask'
                ? 'Ask about decisions, people, or recent chat…'
                : 'Search channels, people, messages...'
            }
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-mono"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-input)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div className="flex gap-1 px-3 pt-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {(['search', 'ask'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setSearchError(null);
              }}
              className="rounded-t-lg px-3 py-1.5 text-[11px] font-semibold"
              style={{
                color: mode === tab ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
                borderBottom: mode === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              {tab === 'search' ? 'Search' : 'Ask AI'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {searchError && (
          <div className="px-4 py-2 text-[11px] text-amber-400 bg-amber-500/10 border-b border-amber-500/20">
            {searchError}
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {mode === 'ask' ? (
            <div className="space-y-3">
              <p className="px-1 text-[11px] text-theme-secondary">
                Press Enter to ask. Answers use messages you can access.
              </p>
              {askAnswer && (
                <div
                  className="rounded-xl border p-3 text-xs leading-relaxed text-theme-primary whitespace-pre-wrap"
                  style={{
                    borderColor: 'var(--color-active-border)',
                    background: 'var(--color-accent-muted)',
                  }}
                >
                  {askAnswer}
                </div>
              )}
              {askCitations.length > 0 && (
                <div>
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-theme-secondary">
                    Sources
                  </p>
                  <div className="space-y-1.5">
                    {askCitations.map((cite) => (
                      <button
                        key={cite.messageId}
                        type="button"
                        onClick={() => {
                          jumpToMessage({
                            messageId: cite.messageId,
                            channelId: cite.channelId,
                            conversationId: cite.conversationId,
                          });
                        }}
                        className="w-full rounded-xl border border-theme bg-theme-input p-2.5 text-left hover-surface-strong"
                      >
                        <div className="flex items-center justify-between text-[11px] text-theme-secondary">
                          <span className="font-semibold text-theme-primary">
                            [{cite.index}] {cite.senderName}
                          </span>
                          <span>{formatTimestamp(cite.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs text-theme-secondary line-clamp-2">{cite.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {query.trim() && !isAsking && !askAnswer && !searchError && (
                <div className="py-8 text-center text-xs text-theme-secondary">
                  Press Enter to ask about “{query}”
                </div>
              )}
            </div>
          ) : (
            <>
          {/* Quick Actions / Jump to */}
          {matchingActions.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span>Quick Actions</span>
              </p>
              <div className="space-y-1">
                {matchingActions.map((act) => (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-theme-primary hover:bg-violet-600/80 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/20">
                        {act.icon}
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-semibold text-theme-primary group-hover:text-white">{act.title}</span>
                        <span className="text-[10px] text-theme-secondary group-hover:text-violet-200 truncate">{act.subtitle}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Channels Section */}
          {results.channels.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-1.5">
                Channels
              </p>
              <div className="space-y-1">
                {results.channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannel(channel.id);
                      setSearchModalOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-theme-primary hover:bg-indigo-600 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {channel.type === 'private' ? (
                        <Lock className="h-4 w-4 text-theme-secondary group-hover:text-white" />
                      ) : (
                        <Hash className="h-4 w-4 text-indigo-400 group-hover:text-white" />
                      )}
                      <span>{channel.name}</span>
                      {channel.description && (
                        <span className="text-[11px] text-theme-secondary group-hover:text-indigo-200 truncate max-w-xs">
                          — {channel.description}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* People Section */}
          {results.users.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-1.5">
                People
              </p>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      createConversation.mutate(u.id);
                      setSearchModalOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-theme-primary hover:bg-indigo-600 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatarUrl} size="xs" status={u.status} showStatus />
                      <span>{u.name}</span>
                      <span className="text-[11px] text-theme-secondary group-hover:text-indigo-200">
                        ({u.title})
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Section */}
          {results.messages.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-1.5">
                Messages
              </p>
              <div className="space-y-1.5">
                {results.messages.slice(0, 8).map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      jumpToMessage({
                        messageId: msg.id,
                        channelId: msg.channelId,
                        conversationId: msg.conversationId,
                      });
                    }}
                    className="rounded-xl border border-theme bg-theme-input p-2.5 hover-surface-strong cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-theme-secondary">
                      <span className="font-semibold text-theme-primary">{msg.senderName}</span>
                      <span>{formatTimestamp(msg.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-theme-secondary line-clamp-2">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && !isSearching && !hasResults && (
            <div className="py-12 text-center text-xs text-theme-secondary">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
