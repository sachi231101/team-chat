import { create } from 'zustand';

export type RailTab = 'home' | 'dms' | 'activity' | 'files' | 'later';
export type ActiveType = 'channel' | 'conversation';
export type DetailsTab = 'about' | 'members' | 'files' | 'pinned' | 'links';
export type ChatHeaderTab = 'messages' | 'files' | 'pinned' | 'links';

export type NavEntry = { type: ActiveType; id: string };

const STARRED_CHANNELS_KEY = 'team_chat_starred_channels';
const THEME_KEY = 'team_chat_theme';

export type AppTheme = 'dark' | 'slate' | 'light';

function loadTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'slate' || stored === 'light') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'dark';
}

function saveTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

function loadStarredChannelIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STARRED_CHANNELS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveStarredChannelIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STARRED_CHANNELS_KEY, JSON.stringify(ids));
}

interface UiState {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  activeRailTab: RailTab;
  setActiveRailTab: (tab: RailTab) => void;

  activeId: string;
  activeType: ActiveType;
  chatHeaderTab: ChatHeaderTab;
  setChatHeaderTab: (tab: ChatHeaderTab) => void;
  setActiveChannel: (channelId: string) => void;
  setActiveConversation: (conversationId: string) => void;
  applyNavigation: (entry: NavEntry, options?: { recordHistory?: boolean }) => void;

  navStack: NavEntry[];
  navIndex: number;

  starredChannelIds: string[];
  toggleStarChannel: (channelId: string) => void;
  pruneStarredChannels: (validChannelIds: string[]) => void;

  typingUsers: { userId: string; userName: string; channelId?: string; conversationId?: string }[];
  addTypingUser: (data: UiState['typingUsers'][number]) => void;
  removeTypingUser: (userId: string) => void;

  activeThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  focusMessageId: string | null;
  setFocusMessageId: (messageId: string | null) => void;
  jumpToMessage: (opts: { messageId: string; channelId?: string; conversationId?: string }) => void;

  detailsPanelOpen: boolean;
  detailsTab: DetailsTab;
  toggleDetailsPanel: () => void;
  setDetailsTab: (tab: DetailsTab) => void;

  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  createChannelModalOpen: boolean;
  setCreateChannelModalOpen: (open: boolean) => void;
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  peopleModalOpen: boolean;
  setPeopleModalOpen: (open: boolean) => void;
  huddleNotesModalOpen: boolean;
  setHuddleNotesModalOpen: (open: boolean) => void;

  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

function pushNavEntry(stack: NavEntry[], index: number, entry: NavEntry) {
  const current = stack[index];
  if (current?.type === entry.type && current?.id === entry.id) {
    return { stack, index };
  }
  const nextStack = stack.slice(0, index + 1);
  nextStack.push(entry);
  return { stack: nextStack, index: nextStack.length - 1 };
}

function entryState(entry: NavEntry) {
  return {
    activeId: entry.id,
    activeType: entry.type,
    activeRailTab: entry.type === 'channel' ? ('home' as const) : ('dms' as const),
    chatHeaderTab: 'messages' as const,
  };
}

export const useUiStore = create<UiState>((set, get) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),

  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  activeRailTab: 'home',
  setActiveRailTab: (activeRailTab) => set({ activeRailTab }),

  activeId: '',
  activeType: 'channel',
  chatHeaderTab: 'messages',
  setChatHeaderTab: (chatHeaderTab) => set({ chatHeaderTab }),

  navStack: [],
  navIndex: -1,

  applyNavigation: (entry, options = {}) => {
    const { recordHistory = true } = options;
    set((state) => {
      const base = entryState(entry);
      if (!recordHistory) {
        const existingIndex = state.navStack.findIndex(
          (item) => item.type === entry.type && item.id === entry.id,
        );
        if (existingIndex >= 0) {
          return { ...base, navIndex: existingIndex };
        }
        return { ...base, navStack: [entry], navIndex: 0 };
      }
      const { stack, index } = pushNavEntry(state.navStack, state.navIndex, entry);
      return { ...base, navStack: stack, navIndex: index };
    });
  },

  setActiveChannel: (channelId) => {
    get().applyNavigation({ type: 'channel', id: channelId });
  },

  setActiveConversation: (conversationId) => {
    get().applyNavigation({ type: 'conversation', id: conversationId });
  },

  starredChannelIds: loadStarredChannelIds(),
  toggleStarChannel: (channelId) =>
    set((state) => {
      const next = state.starredChannelIds.includes(channelId)
        ? state.starredChannelIds.filter((id) => id !== channelId)
        : [...state.starredChannelIds, channelId];
      saveStarredChannelIds(next);
      return { starredChannelIds: next };
    }),
  pruneStarredChannels: (validChannelIds) =>
    set((state) => {
      const next = state.starredChannelIds.filter((id) => validChannelIds.includes(id));
      if (next.length === state.starredChannelIds.length) return state;
      saveStarredChannelIds(next);
      return { starredChannelIds: next };
    }),

  typingUsers: [],
  addTypingUser: (data) =>
    set((state) => {
      if (state.typingUsers.some((u) => u.userId === data.userId)) return state;
      return { typingUsers: [...state.typingUsers, data] };
    }),
  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u.userId !== userId),
    })),

  activeThreadId: null,
  openThread: (messageId) => set({ activeThreadId: messageId }),
  closeThread: () => set({ activeThreadId: null }),
  focusMessageId: null,
  setFocusMessageId: (focusMessageId) => set({ focusMessageId }),
  jumpToMessage: ({ messageId, channelId, conversationId }) => {
    if (channelId) get().setActiveChannel(channelId);
    else if (conversationId) get().setActiveConversation(conversationId);
    get().openThread(messageId);
    set({ focusMessageId: messageId, searchModalOpen: false, activeRailTab: channelId ? 'home' : 'dms' });
  },

  detailsPanelOpen: true,
  detailsTab: 'about',
  toggleDetailsPanel: () => set((s) => ({ detailsPanelOpen: !s.detailsPanelOpen })),
  setDetailsTab: (detailsTab) => {
    const tabMap: Record<DetailsTab, ChatHeaderTab> = {
      about: 'messages',
      members: 'messages',
      files: 'files',
      pinned: 'pinned',
      links: 'links',
    };
    set({ detailsTab, detailsPanelOpen: true, chatHeaderTab: tabMap[detailsTab] });
  },

  searchModalOpen: false,
  setSearchModalOpen: (searchModalOpen) => set({ searchModalOpen }),
  createChannelModalOpen: false,
  setCreateChannelModalOpen: (createChannelModalOpen) => set({ createChannelModalOpen }),
  inviteModalOpen: false,
  setInviteModalOpen: (inviteModalOpen) => set({ inviteModalOpen }),
  profileModalOpen: false,
  setProfileModalOpen: (profileModalOpen) => set({ profileModalOpen }),
  settingsModalOpen: false,
  setSettingsModalOpen: (settingsModalOpen) => set({ settingsModalOpen }),
  peopleModalOpen: false,
  setPeopleModalOpen: (peopleModalOpen) => set({ peopleModalOpen }),
  huddleNotesModalOpen: false,
  setHuddleNotesModalOpen: (huddleNotesModalOpen) => set({ huddleNotesModalOpen }),

  theme: loadTheme(),
  setTheme: (theme) => {
    saveTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const order: AppTheme[] = ['dark', 'slate', 'light'];
    const current = get().theme;
    const next = order[(order.indexOf(current) + 1) % order.length];
    saveTheme(next);
    set({ theme: next });
  },
  density: 'comfortable',
  setDensity: (density) => set({ density }),
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}));
