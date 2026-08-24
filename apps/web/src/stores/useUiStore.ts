import { create } from 'zustand';

export type RailTab = 'home' | 'dms' | 'activity' | 'files' | 'later';
export type ActiveType = 'channel' | 'conversation';
export type DetailsTab = 'about' | 'members' | 'files' | 'pinned';

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
  setActiveChannel: (channelId: string) => void;
  setActiveConversation: (conversationId: string) => void;

  typingUsers: { userId: string; userName: string; channelId?: string; conversationId?: string }[];
  addTypingUser: (data: UiState['typingUsers'][number]) => void;
  removeTypingUser: (userId: string) => void;

  activeThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;

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

  theme: 'dark' | 'slate' | 'light';
  setTheme: (theme: 'dark' | 'slate' | 'light') => void;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
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
  setActiveChannel: (channelId) =>
    set({ activeId: channelId, activeType: 'channel', activeRailTab: 'home' }),
  setActiveConversation: (conversationId) =>
    set({ activeId: conversationId, activeType: 'conversation', activeRailTab: 'dms' }),

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

  detailsPanelOpen: true,
  detailsTab: 'about',
  toggleDetailsPanel: () => set((s) => ({ detailsPanelOpen: !s.detailsPanelOpen })),
  setDetailsTab: (detailsTab) => set({ detailsTab, detailsPanelOpen: true }),

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

  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  density: 'comfortable',
  setDensity: (density) => set({ density }),
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}));
