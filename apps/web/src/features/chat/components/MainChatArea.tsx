import React from 'react';
import { AppHeader } from '../../../components/header';
import { MessageTimeline } from './MessageTimeline';
import { MessageComposer } from './MessageComposer';
import { FilesView } from '../../files/components/FilesView';
import { LaterView } from '../../later/components/LaterView';
import { ActivityView } from '../../notifications/components/ActivityView';
import { useChatDataStore } from '../../../stores';

export const MainChatArea: React.FC = () => {
  const activeRailTab = useChatDataStore((s) => s.activeRailTab);

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
      <MessageTimeline />
      <MessageComposer />
    </main>
  );
};
