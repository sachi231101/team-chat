import React from 'react';
import { ChevronLeft, ChevronRight, Search, HelpCircle, Bell, Menu } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Avatar } from '../ui';

export const GlobalTopBar: React.FC = () => {
  const { setSearchModalOpen, setProfileModalOpen, toggleSidebar } = useUiStore();
  const { currentUser, notifications } = useWorkspace();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div
      className="flex h-[49px] w-full shrink-0 items-center gap-2 px-3"
      style={{ background: 'var(--color-rail)', borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Left: back / forward / history */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md md:hidden hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md opacity-30 cursor-not-allowed"
          style={{ color: 'var(--color-text-secondary)' }}
          disabled
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md opacity-30 cursor-not-allowed"
          style={{ color: 'var(--color-text-secondary)' }}
          disabled
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Center: global search bar */}
      <button
        onClick={() => setSearchModalOpen(true)}
        className="flex flex-1 max-w-2xl mx-auto items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-all"
        style={{
          background: 'var(--color-elevated)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-tertiary)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
        }}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search messages, people, channels...</span>
        <kbd
          className="rounded px-1.5 py-0.5 text-[10px] font-mono"
          style={{ background: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right: help + bell + avatar */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <button
          className="relative flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ background: 'var(--color-badge)' }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button onClick={() => setProfileModalOpen(true)} className="relative flex h-8 w-8 items-center justify-center rounded-full overflow-hidden">
          <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="sm" status={currentUser.status} showStatus />
        </button>
      </div>
    </div>
  );
};
