import React, { useState } from 'react';
import { Settings, Smile, ChevronRight, Check } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Avatar } from '../ui';
import { UserStatus } from '@team-chat/shared';
import { cn } from '../../lib/utils';

export const UserFooter: React.FC = () => {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const { setSettingsModalOpen, setProfileModalOpen } = useUiStore();
  const { currentUser } = useWorkspace();
  const { updateStatus } = useChatMutations();

  const statuses: { label: string; value: UserStatus; color: string }[] = [
    { label: 'Online', value: 'online', color: 'bg-emerald-500' },
    { label: 'Busy (Do Not Disturb)', value: 'busy', color: 'bg-rose-500' },
    { label: 'Away', value: 'away', color: 'bg-amber-500' },
    { label: 'Invisible (Offline)', value: 'offline', color: 'bg-slate-400' },
  ];

  return (
    <div className="relative border-t border-slate-800/80 p-2.5 bg-slate-950/40">
      {/* Quick Status Menu Popover */}
      {statusMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setStatusMenuOpen(false)}
          />
          <div className="absolute bottom-full left-2 z-50 mb-2 w-60 rounded-xl border border-slate-700/80 bg-slate-900 p-1.5 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1.5 border-b border-slate-800">
              <p className="text-xs font-semibold text-white">Set your status</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.statusMessage || 'No status set'}</p>
            </div>

            <div className="py-1 space-y-0.5">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    updateStatus.mutate({ status: s.value });
                    setStatusMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', s.color)} />
                    <span>{s.label}</span>
                  </div>
                  {currentUser.status === s.value && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-1">
              <button
                onClick={() => {
                  setStatusMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Smile className="h-3.5 w-3.5 text-slate-400" />
                  <span>Edit Profile & Status</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setStatusMenuOpen(!statusMenuOpen)}
          className="flex items-center gap-2.5 rounded-lg p-1 text-left hover:bg-slate-800/80 transition-colors flex-1 min-w-0"
        >
          <Avatar
            name={currentUser.name}
            src={currentUser.avatarUrl}
            size="sm"
            status={currentUser.status}
            showStatus
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-100 truncate">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400 truncate">
              {currentUser.statusMessage || currentUser.title || 'Online'}
            </span>
          </div>
        </button>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Preferences"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
