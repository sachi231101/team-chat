import { create } from 'zustand';
import { UIState } from '../types';

interface ChatStoreState extends UIState {
  setSidebarOpen: (open: boolean) => void;
  setThreadOpen: (open: boolean) => void;
  setActiveView: (view: UIState['activeView']) => void;
  setActiveId: (id: string | null) => void;
  setActiveThreadParentId: (id: string | null) => void;
  setSearchModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  sidebarOpen: true,
  threadOpen: false,
  activeView: 'channel',
  activeId: 'chn-general',
  activeThreadParentId: null,
  searchModalOpen: false,
  profileModalOpen: false,
  settingsModalOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setThreadOpen: (open) => set({ threadOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
  setActiveId: (id) => set({ activeId: id }),
  setActiveThreadParentId: (id) => set({ activeThreadParentId: id }),
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
}));
