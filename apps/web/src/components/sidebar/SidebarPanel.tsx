import React from 'react';
import { SquarePen, Search, Plus, ChevronDown, MessagesSquare, Hash } from 'lucide-react';
import { useUiStore } from '../../stores';
import { Tooltip } from '../ui';
import { ChannelList } from './ChannelList';
import { StarredChannelList } from './StarredChannelList';
import { DirectMessageList } from './DirectMessageList';

export const SidebarPanel: React.FC = () => {
  const {
    setSearchModalOpen,
    setCreateChannelModalOpen,
    setPeopleModalOpen,
  } = useUiStore();

  return (
    <aside
      className="flex h-full w-[220px] shrink-0 flex-col"
      style={{ background: 'var(--color-sidebar)', borderRight: '1px solid var(--color-border)' }}
    >
      {/* ── Workspace Header ── */}
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button className="flex items-center gap-1.5 rounded-md px-1 py-1 hover-surface transition-colors min-w-0">
          <span className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            Acme HQ
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
        </button>

        <Tooltip content="New message" side="bottom">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* ── Quick Switcher ── */}
      <div className="px-2 pt-2 pb-1">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors hover-surface"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick switcher</span>
          <span
            className="rounded px-1 py-0.5 text-[10px] font-mono"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-tertiary)' }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* ── Scrollable nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <StarredChannelList />

        {/* CHANNELS section */}
        <div className="px-2 pt-2">
          <div className="mb-1 flex items-center justify-between px-2">
            <span
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" />
              Channels
            </span>
            <Tooltip content="Add a channel" side="right">
              <button
                onClick={() => setCreateChannelModalOpen(true)}
                className="flex h-4 w-4 items-center justify-center rounded transition-colors hover-surface"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
          <ChannelList />
        </div>

        {/* DIRECT MESSAGES section */}
        <div className="px-2 pt-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <span
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
              Direct messages
            </span>
            <Tooltip content="New direct message" side="right">
              <button
                onClick={() => setPeopleModalOpen(true)}
                className="flex h-4 w-4 items-center justify-center rounded transition-colors hover-surface"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
          <DirectMessageList />
        </div>
      </div>
    </aside>
  );
};
