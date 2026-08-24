export * from '@team-chat/shared';

export type ActiveView = 'channel' | 'conversation' | 'threads' | 'people' | 'files' | 'saved';

export interface UIState {
  sidebarOpen: boolean;
  threadOpen: boolean;
  activeView: ActiveView;
  activeId: string | null;
  activeThreadParentId: string | null;
  searchModalOpen: boolean;
  profileModalOpen: boolean;
  settingsModalOpen: boolean;
}
