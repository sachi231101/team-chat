import React from 'react';
import { MessageSquarePlus, ChevronDown, Sparkles } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Tooltip } from '../ui';

export const WorkspaceHeader: React.FC = () => {
  const { setCreateChannelModalOpen } = useChatDataStore();

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800/80 px-4">
      <button className="flex items-center gap-2 text-left transition-opacity hover:opacity-80 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-950 text-white font-bold text-sm">
          TC
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm text-white tracking-tight">Team Chat</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
          </div>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Acme HQ Workspace
          </span>
        </div>
      </button>

      <div className="flex items-center gap-1">
        <Tooltip content="New Channel" side="bottom">
          <button
            onClick={() => setCreateChannelModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
