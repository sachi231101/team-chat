import React from 'react';
import { AppHeader } from '../../../components/header';
import { MessageTimeline } from './MessageTimeline';
import { MessageComposer } from './MessageComposer';
import { ChannelFilesPanel } from './ChannelFilesPanel';
import { ChannelPinnedPanel } from './ChannelPinnedPanel';
import { ChannelLinksPanel } from './ChannelLinksPanel';
import { FilesView } from '../../files/components/FilesView';
import { LaterView } from '../../later/components/LaterView';
import { ActivityView } from '../../notifications/components/ActivityView';
import { useUiStore } from '../../../stores';

export const MainChatArea: React.FC = () => {
  const activeRailTab = useUiStore((s) => s.activeRailTab);
  const chatHeaderTab = useUiStore((s) => s.chatHeaderTab);
  const activeId = useUiStore((s) => s.activeId);

  if (activeRailTab === 'files') {
    return <FilesView />;
  }

  if (activeRailTab === 'later') {
    return <LaterView />;
  }

  if (activeRailTab === 'activity') {
    return <ActivityView />;
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      <AppHeader />
      {!activeId ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Select a channel or direct message to get started.
        </div>
      ) : chatHeaderTab === 'files' ? (
        <ChannelFilesPanel />
      ) : chatHeaderTab === 'pinned' ? (
        <ChannelPinnedPanel />
      ) : chatHeaderTab === 'links' ? (
        <ChannelLinksPanel />
      ) : (
        <>
          <MessageTimeline />
          <MessageComposer />
        </>
      )}
    </main>
  );
};
