import React, { useState } from 'react';
import {
  Home,
  MessageSquare,
  Bell,
  Files,
  Bookmark,
  MoreHorizontal,
  UserPlus,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Tooltip } from '../ui';
import { MoreMenuPopover } from './MoreMenuPopover';
import { cn } from '../../lib/utils';

export const IconRail: React.FC = () => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const {
    activeRailTab,
    setActiveRailTab,
    setProfileModalOpen,
    setPeopleModalOpen,
    setCreateChannelModalOpen,
    theme,
    setTheme,
  } = useUiStore();
  const { currentUser, notifications } = useWorkspace();

  const unreadActivity = notifications.filter((n) => n.unread).length;

  const railItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
      onClick: () => {
        setActiveRailTab('home');
        setMoreMenuOpen(false);
      },
    },
    {
      id: 'dms' as const,
      label: 'DMs',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => {
        setActiveRailTab('dms');
        setMoreMenuOpen(false);
      },
    },
    {
      id: 'activity' as const,
      label: 'Activity',
      icon: <Bell className="h-4 w-4" />,
      badge: unreadActivity > 0 ? unreadActivity : undefined,
      onClick: () => {
        setActiveRailTab('activity');
        setMoreMenuOpen(false);
      },
    },
    {
      id: 'files' as const,
      label: 'Files',
      icon: <Files className="h-4 w-4" />,
      onClick: () => {
        setActiveRailTab('files');
        setMoreMenuOpen(false);
      },
    },
    {
      id: 'later' as const,
      label: 'Later',
      icon: <Bookmark className="h-4 w-4" />,
      onClick: () => {
        setActiveRailTab('later');
        setMoreMenuOpen(false);
      },
    },
    {
      id: 'more' as const,
      label: 'More',
      icon: <MoreHorizontal className="h-4 w-4" />,
      onClick: () => {
        setMoreMenuOpen(!moreMenuOpen);
      },
    },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav
      className="relative flex h-full w-[64px] shrink-0 flex-col items-center py-2 px-1 select-none overflow-y-auto overflow-x-hidden justify-between"
      style={{
        background: 'var(--color-rail)',
        borderRight: '1px solid var(--color-border)',
        scrollbarWidth: 'none',
      }}
    >
      {/* ── Top Section: Workspace Initial + Nav Items ── */}
      <div className="flex flex-col items-center gap-1 w-full">
        {/* Workspace Icon (A for Acme) */}
        <Tooltip content="Acme HQ Workspace" side="right">
          <button
            onClick={() => setActiveRailTab('home')}
            className="mb-1 flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs text-slate-900 shadow-md transition-transform hover:scale-105"
            style={{ background: '#94a3b8' }}
          >
            A
          </button>
        </Tooltip>

        {/* Navigation Items with Labels */}
        {railItems.map((item) => {
          const isActive =
            item.id === 'more'
              ? moreMenuOpen
              : activeRailTab === item.id;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="group flex flex-col items-center justify-center w-full py-0.5 transition-all"
            >
              <div
                className={cn(
                  'relative flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                )}
                style={{
                  background: isActive ? 'var(--color-active-bg)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--color-sidebar-hover)';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                {item.icon}
                {item.badge && (
                  <span
                    className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white shadow-sm"
                    style={{ background: 'var(--color-badge)' }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className="mt-0.5 text-[9px] font-medium tracking-tight transition-colors leading-none"
                style={{
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bottom Section: Action Circles & Profile Avatar ── */}
      <div className="flex flex-col items-center gap-1.5 pt-2 pb-0.5">
        {/* Invite / People button */}
        <Tooltip content="Invite teammates" side="right">
          <button
            onClick={() => setPeopleModalOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        {/* Add Channel / Item */}
        <Tooltip content="Add item" side="right">
          <button
            onClick={() => setCreateChannelModalOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip content={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'} side="right">
          <button
            onClick={toggleTheme}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
            }}
          >
            {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </button>
        </Tooltip>

        {/* User Profile Avatar with snooze badge */}
        <Tooltip content="Profile & Status" side="right">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="relative flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
            style={{
              background: 'var(--color-accent)',
            }}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full ring-1 ring-[var(--color-rail)]"
              style={{
                background: 'var(--color-online)',
              }}
            >
              <span className="text-[6px] font-extrabold text-slate-900 leading-none">z</span>
            </span>
          </button>
        </Tooltip>
      </div>

      {/* More Menu Popover */}
      <MoreMenuPopover
        isOpen={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
      />
    </nav>
  );
};
