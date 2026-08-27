import { create } from 'zustand';
import { Message } from '@team-chat/shared';

export type RailTab = 'home' | 'dms' | 'activity' | 'files' | 'later';
export type ActiveType = 'channel' | 'conversation';
export type DetailsTab = 'about' | 'members' | 'files' | 'pinned' | 'links' | 'actions' | 'decisions';
export type ChatHeaderTab = 'messages' | 'actions' | 'decisions' | 'files' | 'pinned' | 'links';

export type NavEntry = { type: ActiveType; id: string };

export interface OutboxItem {
  clientMessageId: string;
  content: string;
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
  attachments?: { name: string; url: string; size: number; type: string }[];
  status: 'sending' | 'sent' | 'failed';
  error?: string;
  createdAt: string;
}

export interface CustomSidebarSection {
  id: string;
  name: string;
  icon?: string;
  channelIds: string[];
  isCollapsed?: boolean;
}

const STARRED_CHANNELS_KEY = 'team_chat_starred_channels';
const THEME_KEY = 'team_chat_theme';
const CUSTOM_SECTIONS_KEY = 'team_chat_custom_sections';
const PREFS_KEY = 'team_chat_prefs';

export type AppTheme = 'dark' | 'slate' | 'light';

type StoredPrefs = {
  density?: 'comfortable' | 'compact';
  soundEnabled?: boolean;
  sendWithEnter?: boolean;
};

function loadPrefs(): StoredPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredPrefs;
  } catch {
    return {};
  }
}

function savePrefs(patch: StoredPrefs) {
  if (typeof window === 'undefined') return;
  try {
    const next = { ...loadPrefs(), ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

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

function loadCustomSections(): CustomSidebarSection[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_SECTIONS_KEY);
    return raw ? (JSON.parse(raw) as CustomSidebarSection[]) : [];
  } catch {
    return [];
  }
}

function saveCustomSections(sections: CustomSidebarSection[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(sections));
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

  // Custom Sidebar Channel Sections
  customSections: CustomSidebarSection[];
  createCustomSection: (name: string, icon?: string) => string;
  updateCustomSection: (id: string, data: Partial<CustomSidebarSection>) => void;
  deleteCustomSection: (id: string) => void;
  addChannelToCustomSection: (sectionId: string, channelId: string) => void;
  removeChannelFromCustomSection: (sectionId: string, channelId: string) => void;
  toggleCustomSectionCollapse: (sectionId: string) => void;
  createSectionModalOpen: boolean;
  setCreateSectionModalOpen: (open: boolean) => void;
  targetSectionForNewChannel: string | null;
  setTargetSectionForNewChannel: (sectionId: string | null) => void;

  typingUsers: { userId: string; userName: string; channelId?: string; conversationId?: string }[];
  addTypingUser: (data: UiState['typingUsers'][number]) => void;
  removeTypingUser: (userId: string) => void;

  activeThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  focusMessageId: string | null;
  setFocusMessageId: (messageId: string | null) => void;
  editingMessageId: string | null;
  setEditingMessageId: (messageId: string | null) => void;
  jumpToMessage: (opts: { messageId: string; channelId?: string; conversationId?: string }) => void;


  detailsPanelOpen: boolean;
  detailsTab: DetailsTab;
  toggleDetailsPanel: () => void;
  setDetailsTab: (tab: DetailsTab) => void;

  aiPanelOpen: boolean;
  setAiPanelOpen: (open: boolean) => void;
  toggleAiPanel: () => void;

  // Modals & Panels
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  createChannelModalOpen: boolean;
  setCreateChannelModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  peopleModalOpen: boolean;
  setPeopleModalOpen: (open: boolean) => void;
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  addMembersModalOpen: boolean;
  setAddMembersModalOpen: (open: boolean) => void;
  // AI Advantages Modals & Workflows
  dailyBriefingOpen: boolean;
  setDailyBriefingOpen: (open: boolean) => void;
  extractWorkModalOpen: boolean;
  setExtractWorkModalOpen: (open: boolean) => void;
  extractWorkTarget: {
    channelId?: string;
    conversationId?: string;
    parentMessageId?: string;
    messageId?: string;
    transcript?: string;
  } | null;
  setExtractWorkTarget: (target: UiState['extractWorkTarget']) => void;
  openExtractWorkForTarget: (target: NonNullable<UiState['extractWorkTarget']>) => void;
  multiAgentStudioOpen: boolean;
  setMultiAgentStudioOpen: (open: boolean) => void;
  aiLearningModalOpen: boolean;
  setAiLearningModalOpen: (open: boolean) => void;
  recordDecisionModalOpen: boolean;
  setRecordDecisionModalOpen: (open: boolean) => void;
  decisionTarget: {
    channelId?: string;
    messageId?: string;
    title?: string;
    rationale?: string;
  } | null;
  setDecisionTarget: (target: UiState['decisionTarget']) => void;
  openRecordDecision: (target?: UiState['decisionTarget']) => void;

  // Action Management & Context
  createActionModalOpen: boolean;
  setCreateActionModalOpen: (open: boolean) => void;
  actionTargetMessage: Message | null;
  setActionTargetMessage: (msg: Message | null) => void;
  openCreateActionForMessage: (msg: Message) => void;

  // Reliable Messaging Outbox
  outbox: OutboxItem[];
  addOutboxItem: (item: OutboxItem) => void;
  updateOutboxItem: (clientMessageId: string, status: 'sending' | 'sent' | 'failed', error?: string) => void;
  removeOutboxItem: (clientMessageId: string) => void;

  // Focus & DND
  dndEnabled: boolean;
  dndUntil: string | null;
  setDnd: (enabled: boolean, until?: string | null) => void;

  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  sendWithEnter: boolean;
  setSendWithEnter: (enabled: boolean) => void;
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
  setActiveRailTab: (activeRailTab) =>
    set({
      activeRailTab,
      ...(activeRailTab === 'files' || activeRailTab === 'later' || activeRailTab === 'activity'
        ? { profileModalOpen: false, settingsModalOpen: false }
        : {}),
    }),

  activeId: '',
  activeType: 'channel',
  chatHeaderTab: 'messages',
  setChatHeaderTab: (chatHeaderTab) => set({ chatHeaderTab }),

  navStack: [],
  navIndex: -1,

  applyNavigation: (entry, options = {}) => {
    const { recordHistory = true } = options;
    set((state) => {
      const base = { ...entryState(entry), profileModalOpen: false, settingsModalOpen: false };
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

  // Custom Sidebar Channel Sections Implementation
  customSections: loadCustomSections(),
  createSectionModalOpen: false,
  setCreateSectionModalOpen: (createSectionModalOpen) => set({ createSectionModalOpen }),
  targetSectionForNewChannel: null,
  setTargetSectionForNewChannel: (targetSectionForNewChannel) => set({ targetSectionForNewChannel }),

  createCustomSection: (name: string, icon?: string) => {
    const newSection: CustomSidebarSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      icon: icon || 'folder',
      channelIds: [],
      isCollapsed: false,
    };
    set((state) => {
      const next = [...state.customSections, newSection];
      saveCustomSections(next);
      return { customSections: next };
    });
    return newSection.id;
  },

  updateCustomSection: (id, data) =>
    set((state) => {
      const next = state.customSections.map((s) => (s.id === id ? { ...s, ...data } : s));
      saveCustomSections(next);
      return { customSections: next };
    }),

  deleteCustomSection: (id) =>
    set((state) => {
      const next = state.customSections.filter((s) => s.id !== id);
      saveCustomSections(next);
      return { customSections: next };
    }),

  addChannelToCustomSection: (sectionId, channelId) =>
    set((state) => {
      const next = state.customSections.map((s) => {
        if (s.id === sectionId) {
          if (s.channelIds.includes(channelId)) return s;
          return { ...s, channelIds: [...s.channelIds, channelId] };
        }
        // Remove from other custom sections if any to avoid duplication
        return { ...s, channelIds: s.channelIds.filter((cId) => cId !== channelId) };
      });
      saveCustomSections(next);
      return { customSections: next };
    }),

  removeChannelFromCustomSection: (sectionId, channelId) =>
    set((state) => {
      const next = state.customSections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, channelIds: s.channelIds.filter((cId) => cId !== channelId) };
        }
        return s;
      });
      saveCustomSections(next);
      return { customSections: next };
    }),

  toggleCustomSectionCollapse: (sectionId) =>
    set((state) => {
      const next = state.customSections.map((s) =>
        s.id === sectionId ? { ...s, isCollapsed: !s.isCollapsed } : s,
      );
      saveCustomSections(next);
      return { customSections: next };
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
  editingMessageId: null,
  setEditingMessageId: (editingMessageId) => set({ editingMessageId }),
  jumpToMessage: ({ messageId, channelId, conversationId }) => {
    if (channelId) get().setActiveChannel(channelId);
    else if (conversationId) get().setActiveConversation(conversationId);
    set({
      focusMessageId: messageId,
      searchModalOpen: false,
      chatHeaderTab: 'messages',
      profileModalOpen: false,
      settingsModalOpen: false,
      activeRailTab: channelId ? 'home' : conversationId ? 'dms' : get().activeRailTab,
    });
  },

  detailsPanelOpen: false,
  detailsTab: 'about',
  toggleDetailsPanel: () =>
    set((s) => ({
      detailsPanelOpen: !s.detailsPanelOpen,
      aiPanelOpen: !s.detailsPanelOpen ? false : s.aiPanelOpen,
    })),
  setDetailsTab: (detailsTab) => {
    const tabMap: Record<DetailsTab, ChatHeaderTab> = {
      about: 'messages',
      members: 'messages',
      files: 'files',
      pinned: 'pinned',
      links: 'links',
      actions: 'actions',
      decisions: 'decisions',
    };
    set({
      detailsTab,
      detailsPanelOpen: true,
      aiPanelOpen: false,
      chatHeaderTab: tabMap[detailsTab],
    });
  },

  aiPanelOpen: false,
  setAiPanelOpen: (aiPanelOpen) =>
    set((s) => ({
      aiPanelOpen,
      detailsPanelOpen: aiPanelOpen ? false : s.detailsPanelOpen,
    })),
  toggleAiPanel: () =>
    set((s) => ({
      aiPanelOpen: !s.aiPanelOpen,
      detailsPanelOpen: !s.aiPanelOpen ? false : s.detailsPanelOpen,
    })),

  searchModalOpen: false,
  setSearchModalOpen: (searchModalOpen) => set({ searchModalOpen }),
  createChannelModalOpen: false,
  setCreateChannelModalOpen: (createChannelModalOpen) => set({ createChannelModalOpen }),
  profileModalOpen: false,
  setProfileModalOpen: (profileModalOpen) =>
    set({
      profileModalOpen,
      ...(profileModalOpen ? { settingsModalOpen: false } : {}),
    }),
  settingsModalOpen: false,
  setSettingsModalOpen: (settingsModalOpen) =>
    set({
      settingsModalOpen,
      ...(settingsModalOpen ? { profileModalOpen: false } : {}),
    }),
  peopleModalOpen: false,
  setPeopleModalOpen: (peopleModalOpen) => set({ peopleModalOpen }),
  inviteModalOpen: false,
  setInviteModalOpen: (inviteModalOpen) => set({ inviteModalOpen }),
  addMembersModalOpen: false,
  setAddMembersModalOpen: (addMembersModalOpen) => set({ addMembersModalOpen }),

  // AI Advantages Modals & Workflows
  dailyBriefingOpen: false,
  setDailyBriefingOpen: (dailyBriefingOpen) => set({ dailyBriefingOpen }),
  extractWorkModalOpen: false,
  setExtractWorkModalOpen: (extractWorkModalOpen) => set({ extractWorkModalOpen }),
  extractWorkTarget: null,
  setExtractWorkTarget: (extractWorkTarget) => set({ extractWorkTarget }),
  openExtractWorkForTarget: (target) =>
    set({ extractWorkTarget: target, extractWorkModalOpen: true }),
  multiAgentStudioOpen: false,
  setMultiAgentStudioOpen: (multiAgentStudioOpen) => set({ multiAgentStudioOpen }),
  aiLearningModalOpen: false,
  setAiLearningModalOpen: (aiLearningModalOpen) => set({ aiLearningModalOpen }),
  recordDecisionModalOpen: false,
  setRecordDecisionModalOpen: (recordDecisionModalOpen) => set({ recordDecisionModalOpen }),
  decisionTarget: null,
  setDecisionTarget: (decisionTarget) => set({ decisionTarget }),
  openRecordDecision: (target) =>
    set({ decisionTarget: target || null, recordDecisionModalOpen: true }),

  // Action Management
  createActionModalOpen: false,
  setCreateActionModalOpen: (createActionModalOpen) => set({ createActionModalOpen }),
  actionTargetMessage: null,
  setActionTargetMessage: (actionTargetMessage) => set({ actionTargetMessage }),
  openCreateActionForMessage: (msg) =>
    set({ actionTargetMessage: msg, createActionModalOpen: true }),

  // Outbox
  outbox: [],
  addOutboxItem: (item) =>
    set((state) => ({
      outbox: [...state.outbox.filter((o) => o.clientMessageId !== item.clientMessageId), item],
    })),
  updateOutboxItem: (clientMessageId, status, error) =>
    set((state) => ({
      outbox: state.outbox.map((o) =>
        o.clientMessageId === clientMessageId ? { ...o, status, error } : o,
      ),
    })),
  removeOutboxItem: (clientMessageId) =>
    set((state) => ({
      outbox: state.outbox.filter((o) => o.clientMessageId !== clientMessageId),
    })),

  // Focus / DND
  dndEnabled: false,
  dndUntil: null,
  setDnd: (dndEnabled, dndUntil = null) => set({ dndEnabled, dndUntil }),

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
  density: loadPrefs().density === 'compact' ? 'compact' : 'comfortable',
  setDensity: (density) => {
    savePrefs({ density });
    set({ density });
  },
  soundEnabled: loadPrefs().soundEnabled !== false,
  setSoundEnabled: (soundEnabled) => {
    savePrefs({ soundEnabled });
    set({ soundEnabled });
  },
  sendWithEnter: loadPrefs().sendWithEnter !== false,
  setSendWithEnter: (sendWithEnter) => {
    savePrefs({ sendWithEnter });
    set({ sendWithEnter });
  },
}));
