import React, { useEffect } from 'react';
import { IconRail } from '../../components/sidebar/IconRail';
import { SidebarPanel } from '../../components/sidebar/SidebarPanel';
import { GlobalTopBar } from '../../components/header/GlobalTopBar';
import {
  MainChatArea,
  AiBotPanel,
  CreateActionModal,
  ConversationToWorkModal,
  RecordDecisionModal,
} from '../../features/chat/components';
import { ThreadPanel } from '../../features/threads/components';
import { DetailsPanel } from '../../components/details';
import { ErrorToast } from '../../components/common';
import { useUiStore } from '../../stores';
import { useChatSession } from '../../hooks';
import { useChatNavigation } from '../../hooks/useChatNavigation';
import {
  SearchModal,
  CreateChannelModal,
  PeopleModal,
  InviteTeammatesModal,
  CreateSectionModal,
  AddChannelMembersModal,
} from '../../components/modals';

export const ChatLayout: React.FC = () => {
  useChatSession();
  useChatNavigation();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const detailsPanelOpen = useUiStore((s) => s.detailsPanelOpen);
  const aiPanelOpen = useUiStore((s) => s.aiPanelOpen);

  useEffect(() => {
    const apply = () => {
      if (window.innerWidth < 768) {
        useUiStore.setState({ sidebarOpen: false, detailsPanelOpen: false, aiPanelOpen: false });
      }
    };
    apply();
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden antialiased"
      style={{ background: 'var(--color-main)', color: 'var(--color-text-primary)' }}
    >
      <GlobalTopBar />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className={sidebarOpen ? 'flex' : 'hidden md:flex'}>
          <IconRail />
        </div>
        <div className={sidebarOpen ? 'flex' : 'hidden md:flex'}>
          <SidebarPanel />
        </div>

        <div className="flex flex-1 overflow-hidden min-w-0">
          <MainChatArea />
          <ThreadPanel />
          {detailsPanelOpen && <DetailsPanel />}
          {aiPanelOpen && <AiBotPanel />}
        </div>
      </div>

      <SearchModal />
      <CreateChannelModal />
      <CreateActionModal />
      <ConversationToWorkModal />
      <RecordDecisionModal />
      <PeopleModal />
      <InviteTeammatesModal />
      <AddChannelMembersModal />
      <CreateSectionModal />
      <ErrorToast />
    </div>
  );
};
