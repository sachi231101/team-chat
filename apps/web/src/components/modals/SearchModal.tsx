import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Hash, Lock, Loader2, ArrowRight, Bookmark, FileText, Bell, MessageSquare, Settings, User as UserIcon, Sparkles } from 'lucide-react';
import { useChatDataStore } from '../../stores';
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

  const {
    searchModalOpen,
    setSearchModalOpen,
    channels,
    users,
    setActiveChannel,
    createConversation,
    setActiveRailTab,
    setProfileModalOpen,
    setSettingsModalOpen,
  } = useChatDataStore();

  const quickActions: QuickAction[] = useMemo(() => [
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
      icon: <Settings className="h-4 w-4 text-slate-400" />,
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

  useEffect(() => {
    if (!searchModalOpen) return;
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchModalOpen, doSearch]);

  // Reset when opening
  useEffect(() => {
    if (searchModalOpen) {
      setQuery('');
      setResults({ channels: channels.slice(0, 5), users: users.slice(0, 5), messages: [] });
      setSearchError(null);
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
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/90 animate-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-indigo-400 shrink-0 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-indigo-400 shrink-0" />
          )}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels, people, messages..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Error banner */}
        {searchError && (
          <div className="px-4 py-2 text-[11px] text-amber-400 bg-amber-500/10 border-b border-amber-500/20">
            {searchError}
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions / Jump to */}
          {matchingActions.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span>Quick Actions</span>
              </p>
              <div className="space-y-1">
                {matchingActions.map((act) => (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-violet-600/80 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/20">
                        {act.icon}
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-semibold text-slate-200 group-hover:text-white">{act.title}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-violet-200 truncate">{act.subtitle}</span>
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
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {channel.type === 'private' ? (
                        <Lock className="h-4 w-4 text-slate-400 group-hover:text-white" />
                      ) : (
                        <Hash className="h-4 w-4 text-indigo-400 group-hover:text-white" />
                      )}
                      <span>{channel.name}</span>
                      {channel.description && (
                        <span className="text-[11px] text-slate-400 group-hover:text-indigo-200 truncate max-w-xs">
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
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                People
              </p>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      createConversation(u.id);
                      setSearchModalOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatarUrl} size="xs" status={u.status} showStatus />
                      <span>{u.name}</span>
                      <span className="text-[11px] text-slate-400 group-hover:text-indigo-200">
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
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Messages
              </p>
              <div className="space-y-1.5">
                {results.messages.slice(0, 8).map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      if (msg.channelId) setActiveChannel(msg.channelId);
                      setSearchModalOpen(false);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{msg.senderName}</span>
                      <span>{formatTimestamp(msg.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && !isSearching && !hasResults && (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
