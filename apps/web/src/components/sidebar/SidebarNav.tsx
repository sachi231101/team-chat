import React from 'react';
import { Search, MessageSquare, Users, FolderOpen, Bookmark } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useActiveMessages } from '../../hooks';

export const SidebarNav: React.FC = () => {
  const { openThread, setPeopleModalOpen, setDetailsTab, setSearchModalOpen } = useUiStore();
  const { messages } = useActiveMessages();

  const threadsCount = messages.filter((m) => (m.replyCount || 0) > 0).length;

  const handleOpenLatestThread = () => {
    const parentMsg = messages.find((m) => (m.replyCount || 0) > 0);
    if (parentMsg) {
      openThread(parentMsg.id);
    }
  };

  return (
    <div className="px-2 py-2.5 space-y-0.5 text-xs font-medium text-slate-400">
      <button
        onClick={() => setSearchModalOpen(true)}
        className="flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Search className="h-4 w-4 text-indigo-400" />
          <span>Jump to...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
          Ctrl K
        </kbd>
      </button>

      <button
        onClick={handleOpenLatestThread}
        className="flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <span>Threads</span>
        </div>
        {threadsCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-800 px-1 text-[10px] font-bold text-slate-300">
            {threadsCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setPeopleModalOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
      >
        <Users className="h-4 w-4 text-slate-400" />
        <span>People & Directory</span>
      </button>

      <button
        onClick={() => setDetailsTab('files')}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
      >
        <FolderOpen className="h-4 w-4 text-slate-400" />
        <span>Files & Media</span>
      </button>

      <button
        onClick={() => setDetailsTab('pinned')}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
      >
        <Bookmark className="h-4 w-4 text-slate-400" />
        <span>Pinned & Saved</span>
      </button>
    </div>
  );
};
