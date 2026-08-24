import React, { useEffect } from 'react';
import { IconRail } from '../../components/sidebar/IconRail';
import { SidebarPanel } from '../../components/sidebar/SidebarPanel';
import { GlobalTopBar } from '../../components/header/GlobalTopBar';
import { MainChatArea } from '../../features/chat/components';
import { ThreadPanel } from '../../features/threads/components';
import { DetailsPanel } from '../../components/details';
import { ErrorToast } from '../../components/common';
import { useChatDataStore } from '../../stores';
import {
  SearchModal,
  CreateChannelModal,
  InviteModal,
  ProfileModal,
  SettingsModal,
  PeopleModal,
  CreateTaskModal,
  CreateApprovalModal,
} from '../../components/modals';

export const ChatLayout: React.FC = () => {
  const initStore = useChatDataStore((s) => s.initStore);

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden antialiased"
      style={{ background: 'var(--color-main)', color: 'var(--color-text-primary)' }}
    >
      {/* ── Row 1: Global Top Bar (full width) ── */}
      <GlobalTopBar />

      {/* ── Row 2: Main body (icon rail + sidebar + chat) ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Icon Rail */}
        <IconRail />

        {/* Sidebar Panel */}
        <SidebarPanel />

        {/* Conversation + Optional Panels */}
        <div className="flex flex-1 overflow-hidden min-w-0">
          <MainChatArea />
          <ThreadPanel />
          <DetailsPanel />
        </div>
      </div>

      {/* ── Modals ── */}
      <SearchModal />
      <CreateChannelModal />
      <InviteModal />
      <ProfileModal />
      <SettingsModal />
      <PeopleModal />
      <CreateTaskModal />
      <CreateApprovalModal />

      {/* ── Global Error Toast ── */}
      <ErrorToast />
    </div>
  );
};
