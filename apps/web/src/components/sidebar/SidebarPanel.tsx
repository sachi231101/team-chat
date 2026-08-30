import React, { useState, useRef, useEffect } from 'react';
import {
  SquarePen,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  MessagesSquare,
  Hash,
  Star,
  UserPlus,
  Settings,
  Users,
  FolderPlus,
  Folder,
  Sparkles,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useResizablePanel, useWorkspace } from '../../hooks';
import { Tooltip } from '../ui';
import { ResizeHandle } from '../common';
import { isAgentUserId } from '../../utils/isAgentUserId';
import { ChannelList } from './ChannelList';
import { StarredChannelList } from './StarredChannelList';
import { DirectMessageList } from './DirectMessageList';
import { DirectMessagesSidebar } from './DirectMessagesSidebar';
import { CustomSidebarSectionRow } from './CustomSidebarSectionRow';
import { AiAppsList } from './AiAppsList';

export const SidebarPanel: React.FC = () => {
  const {
    activeRailTab,
    setSearchModalOpen,
    setCreateChannelModalOpen,
    setPeopleModalOpen,
    setSettingsModalOpen,
    setInviteModalOpen,
    setCreateSectionModalOpen,
    customSections,
    starredChannelIds,
  } = useUiStore();

  const { channels, users } = useWorkspace();

  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isStarredOpen, setIsStarredOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isAiAppsOpen, setIsAiAppsOpen] = useState(true);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    };
    if (workspaceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [workspaceMenuOpen]);

  const { width, isDragging, handleProps } = useResizablePanel({
    storageKey: 'team_chat_sidebar_width',
    defaultWidth: 250,
    minWidth: 200,
    maxWidth: 480,
    direction: 'right',
  });

  const customSectionChannelIds = customSections.flatMap((s) => s.channelIds);
  const unstarredChannels = channels.filter(
    (c) => !starredChannelIds.includes(c.id) && !customSectionChannelIds.includes(c.id),
  );
  const starredChannels = channels.filter((c) => starredChannelIds.includes(c.id));
  const aiApps = users.filter((u) => isAgentUserId(u.id));

  if (activeRailTab === 'dms') {
    return (
      <aside
        className="relative flex h-full shrink-0 flex-col"
        style={{
          width: `${width}px`,
          background: 'var(--color-sidebar)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <DirectMessagesSidebar />
        <ResizeHandle
          direction="right"
          isDragging={isDragging}
          onMouseDown={handleProps.onMouseDown}
        />
      </aside>
    );
  }

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col"
      style={{
        width: `${width}px`,
        background: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* ── Workspace Header with Interactive Dropdown Menu ── */}
      <div
        ref={menuRef}
        className="relative flex h-[49px] shrink-0 items-center justify-between px-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover-surface transition-colors min-w-0"
        >
          <span className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            Acme HQ
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
              workspaceMenuOpen ? 'rotate-180 text-violet-400' : 'text-stone-400'
            }`}
          />
        </button>

        <div className="flex items-center gap-0.5">
          <Tooltip content="Create custom section" side="bottom">
            <button
              type="button"
              onClick={() => setCreateSectionModalOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover-surface text-stone-400 hover:text-violet-300"
              aria-label="Create custom section"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Workspace Dropdown Popover Menu */}
        {workspaceMenuOpen && (
          <div
            className="absolute left-2 top-full mt-1.5 w-60 rounded-xl p-1.5 shadow-2xl z-50 border animate-in fade-in zoom-in-95"
            style={{
              background: 'var(--color-modal)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs shadow-sm">
                  HQ
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Acme HQ</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Free Plan • {channels.length} channels</p>
                </div>
              </div>
            </div>

            <div className="space-y-0.5">
              {/* Option 1: Create a channel */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  setCreateChannelModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors hover:bg-white/5 text-stone-200"
              >
                <Hash className="h-4 w-4 text-stone-400" />
                <span>Create a channel</span>
              </button>

              {/* Option 2: Create a custom section */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  setCreateSectionModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors hover:bg-violet-600/20 text-violet-300"
              >
                <FolderPlus className="h-4 w-4 text-violet-400" />
                <span>Create a section</span>
              </button>

              {/* Option 3: Invite teammates */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  setInviteModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors hover:bg-white/5 text-stone-200"
              >
                <UserPlus className="h-4 w-4 text-stone-400" />
                <span>Invite teammates</span>
              </button>

              {/* Option 4: People & Directory */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  setPeopleModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors hover:bg-white/5 text-stone-200"
              >
                <Users className="h-4 w-4 text-stone-400" />
                <span>People & directory</span>
              </button>

              {/* Option 5: Workspace Settings */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  setSettingsModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors hover:bg-white/5 text-stone-200"
              >
                <Settings className="h-4 w-4 text-stone-400" />
                <span>Preferences & settings</span>
              </button>
            </div>
          </div>
        )}
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1">
        {/* 1. STARRED section */}
        {starredChannels.length > 0 && (
          <div className="px-2 pb-1">
            <div className="mb-0.5 flex items-center justify-between px-2 py-1 rounded-md hover-surface group">
              <button
                type="button"
                onClick={() => setIsStarredOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors flex-1 text-left"
                style={{ color: 'var(--color-text-secondary)' }}
                title={isStarredOpen ? 'Collapse Starred' : 'Expand Starred'}
              >
                {isStarredOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
                )}
                <Star className="h-3.5 w-3.5 shrink-0 text-amber-400 fill-amber-400/20" />
                <span>Starred</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-normal"
                  style={{
                    background: 'var(--color-elevated)',
                    color: 'var(--color-text-tertiary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {starredChannels.length}
                </span>
              </button>
            </div>
            {isStarredOpen && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                <StarredChannelList />
              </div>
            )}
          </div>
        )}

        {/* 2. CUSTOM USER-CREATED SECTIONS */}
        {customSections.map((section) => (
          <CustomSidebarSectionRow key={section.id} section={section} />
        ))}

        {/* 3. DEFAULT CHANNELS section with Dropdown / Dropup Toggle */}
        <div className="px-2 pt-1">
          <div className="mb-0.5 flex items-center justify-between px-2 py-1 rounded-md hover-surface group">
            <button
              type="button"
              onClick={() => setIsChannelsOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors flex-1 text-left"
              style={{ color: 'var(--color-text-secondary)' }}
              title={isChannelsOpen ? 'Collapse Channels (Drop up)' : 'Expand Channels (Drop down)'}
            >
              {isChannelsOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
              )}
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span>Channels</span>
              <span
                className="text-[10px] px-1.5 py-0.2 rounded-full font-normal"
                style={{
                  background: 'var(--color-elevated)',
                  color: 'var(--color-text-tertiary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {unstarredChannels.length}
              </span>
            </button>

            <Tooltip content="Create new channel" side="right">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateChannelModalOpen(true);
                }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                aria-label="Add channel"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>

          {isChannelsOpen && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <ChannelList />
            </div>
          )}
        </div>

        {/* 4. DIRECT MESSAGES section with Dropdown / Dropup Toggle */}
        <div className="px-2 pt-3">
          <div className="mb-0.5 flex items-center justify-between px-2 py-1 rounded-md hover-surface group">
            <button
              type="button"
              onClick={() => setIsDmsOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors flex-1 text-left"
              style={{ color: 'var(--color-text-secondary)' }}
              title={isDmsOpen ? 'Collapse Direct messages' : 'Expand Direct messages'}
            >
              {isDmsOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
              )}
              <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
              <span>Direct messages</span>
            </button>

            <Tooltip content="New direct message" side="right">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPeopleModalOpen(true);
                }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                aria-label="New direct message"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>

          {isDmsOpen && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <DirectMessageList />
            </div>
          )}
        </div>

        {/* 5. AI APPS section */}
        {aiApps.length > 0 && (
          <div className="px-2 pt-3">
            <div className="mb-0.5 flex items-center justify-between px-2 py-1 rounded-md hover-surface group">
              <button
                type="button"
                onClick={() => setIsAiAppsOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors flex-1 text-left"
                style={{ color: 'var(--color-text-secondary)' }}
                title={isAiAppsOpen ? 'Collapse AI Apps' : 'Expand AI Apps'}
              >
                {isAiAppsOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
                )}
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>AI Apps</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-normal"
                  style={{
                    background: 'var(--color-elevated)',
                    color: 'var(--color-text-tertiary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {aiApps.length}
                </span>
              </button>
            </div>

            {isAiAppsOpen && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                <AiAppsList />
              </div>
            )}
          </div>
        )}
      </div>

      <ResizeHandle
        direction="right"
        isDragging={isDragging}
        onMouseDown={handleProps.onMouseDown}
      />
    </aside>
  );
};
