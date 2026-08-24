import React from 'react';
import { WorkspaceHeader } from './WorkspaceHeader';
import { SidebarNav } from './SidebarNav';
import { ChannelList } from './ChannelList';
import { DirectMessageList } from './DirectMessageList';
import { UserFooter } from './UserFooter';

export const Sidebar: React.FC = () => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800/80 bg-slate-950/70 select-none">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800">
        <SidebarNav />
        <div className="h-px bg-slate-800/50 mx-2 my-1" />
        <ChannelList />
        <div className="h-px bg-slate-800/50 mx-2 my-1" />
        <DirectMessageList />
      </div>

      <UserFooter />
    </aside>
  );
};
