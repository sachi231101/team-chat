import React, { useState } from 'react';
import {
  Home,
  MessageSquare,
  Bell,
  Files,
  Bookmark,
  Users,
  Moon,
  Sun,
  Monitor,
  UserPlus,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Tooltip } from '../ui';
import { ProfileMenuPopover } from './ProfileMenuPopover';
import { cn } from '../../lib/utils';

export const IconRail: React.FC = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<DOMRect | null>(null);

  const {
    activeRailTab,
    setActiveRailTab,
    setActiveConversation,
    setPeopleModalOpen,
    setInviteModalOpen,
    theme,
    toggleTheme,
  } = useUiStore();
  const { currentUser, notifications, conversations } = useWorkspace();
  const { createConversation } = useChatMutations();

  const unreadActivity = notifications.filter((n) => n.unread).length;

  const railItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
      onClick: () => setActiveRailTab('home'),
    },
    {
      id: 'dms' as const,
      label: 'DMs',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => {
        setActiveRailTab('dms');
        const selfConvo = conversations.find((c) => {
          const u = Array.from(new Set(c.participants));
          return u.length === 1 && u[0] === currentUser.id;
        });
        if (selfConvo) {
          setActiveConversation(selfConvo.id);
        } else if (currentUser?.id) {
          createConversation.mutate(currentUser.id, {
            onSuccess: (convo: { id: string }) => setActiveConversation(convo.id),
          });
        }
      },
    },
    {
      id: 'activity' as const,
      label: 'Activity',
      icon: <Bell className="h-4 w-4" />,
      badge: unreadActivity > 0 ? unreadActivity : undefined,
      onClick: () => setActiveRailTab('activity'),
    },
    {
      id: 'files' as const,
      label: 'Files',
      icon: <Files className="h-4 w-4" />,
      onClick: () => setActiveRailTab('files'),
    },
    {
      id: 'later' as const,
      label: 'Later',
      icon: <Bookmark className="h-4 w-4" />,
      onClick: () => setActiveRailTab('later'),
    },
  ];

  const railActionBtnStyle = {
    background: 'var(--color-rail-button-bg)',
    color: 'var(--color-text-secondary)',
  } as const;

  const onRailActionEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--color-rail-button-hover)';
    e.currentTarget.style.color = 'var(--color-text-primary)';
  };

  const onRailActionLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--color-rail-button-bg)';
    e.currentTarget.style.color = 'var(--color-text-secondary)';
  };

  const themeToggle = {
    dark: {
      icon: <Moon className="h-3.5 w-3.5" />,
      label: 'Dark mode — click for Slate Navy',
      next: 'Slate Navy',
    },
    slate: {
      icon: <Monitor className="h-3.5 w-3.5" />,
      label: 'Slate Navy — click for Light',
      next: 'Light',
    },
    light: {
      icon: <Sun className="h-3.5 w-3.5" />,
      label: 'Light mode — click for Dark',
      next: 'Dark',
    },
  }[theme];

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
          const isActive = activeRailTab === item.id;

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
                  color: isActive ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
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
                  color: isActive ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
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
      <div className="flex flex-col items-center gap-1.5 pt-2 pb-0.5 w-full">
        {/* 1. Dedicated Invite Teammates button */}
        <Tooltip content="Invite teammates" side="right">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105"
            style={railActionBtnStyle}
            onMouseEnter={onRailActionEnter}
            onMouseLeave={onRailActionLeave}
            aria-label="Invite teammates"
          >
            <UserPlus className="h-3.5 w-3.5 text-violet-400" />
          </button>
        </Tooltip>

        {/* 2. People & Directory */}
        <Tooltip content="People & directory" side="right">
          <button
            onClick={() => setPeopleModalOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105"
            style={railActionBtnStyle}
            onMouseEnter={onRailActionEnter}
            onMouseLeave={onRailActionLeave}
            aria-label="People & directory"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip content={`${themeToggle.label}`} side="right">
          <button
            onClick={toggleTheme}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105"
            style={railActionBtnStyle}
            onMouseEnter={onRailActionEnter}
            onMouseLeave={onRailActionLeave}
            aria-label={`Current theme: ${theme}. Switch to ${themeToggle.next}.`}
          >
            {themeToggle.icon}
          </button>
        </Tooltip>

        {/* User Profile Avatar */}
        <Tooltip content="Profile & Status" side="right">
          <button
            onClick={(e) => {
              setProfileAnchor(e.currentTarget.getBoundingClientRect());
              setProfileMenuOpen((open) => !open);
            }}
            className="relative flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
            style={{ background: 'var(--color-accent)' }}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-[var(--color-rail)]"
              style={{
                background:
                  currentUser.status === 'away' || currentUser.status === 'offline'
                    ? 'var(--color-away, #f59e0b)'
                    : currentUser.status === 'busy'
                      ? 'var(--color-busy, #f43f5e)'
                      : 'var(--color-online)',
              }}
            />
          </button>
        </Tooltip>
      </div>

      <ProfileMenuPopover
        isOpen={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        anchorRect={profileAnchor}
      />
    </nav>
  );
};
