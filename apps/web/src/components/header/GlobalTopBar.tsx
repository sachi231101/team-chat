import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, HelpCircle, Bell, Menu, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Tooltip } from '../ui';
import { NotificationsPopover } from './NotificationsPopover';
import { HelpPopover } from './HelpPopover';

export const GlobalTopBar: React.FC = () => {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    setSearchModalOpen,
    toggleSidebar,
    navIndex,
    navStack,
    aiPanelOpen,
    toggleAiPanel,
  } = useUiStore();
  const { notifications } = useWorkspace();
  const unread = notifications.filter((n) => n.unread).length;

  const canGoBack = navIndex > 0;
  const canGoForward = navIndex >= 0 && navIndex < navStack.length - 1;

  const navBtnClass = (enabled: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
      enabled ? 'hover-surface cursor-pointer' : 'opacity-30 cursor-not-allowed'
    }`;

  const handleBack = () => {
    if (!canGoBack) return;
    navigate(-1);
  };

  const handleForward = () => {
    if (!canGoForward) return;
    navigate(1);
  };

  return (
    <div
      className="flex h-[49px] w-full shrink-0 items-center gap-2 px-3"
      style={{ background: 'var(--color-rail)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md md:hidden hover-surface"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navBtnClass(canGoBack)}
          style={{ color: 'var(--color-text-secondary)' }}
          disabled={!canGoBack}
          onClick={handleBack}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navBtnClass(canGoForward)}
          style={{ color: 'var(--color-text-secondary)' }}
          disabled={!canGoForward}
          onClick={handleForward}
          aria-label="Go forward"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

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

      <div className="flex items-center gap-1.5 shrink-0">
        <Tooltip content={aiPanelOpen ? 'Close WorkspaceAgent' : 'Message WorkspaceAgent'} side="bottom">
          <button
            type="button"
            onClick={toggleAiPanel}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{
              background: aiPanelOpen ? 'var(--color-accent-muted)' : 'transparent',
              color: aiPanelOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
            aria-label="Toggle WorkspaceAgent"
          >
            <Bot className="h-4 w-4" />
          </button>
        </Tooltip>

        <div className="relative">
          <Tooltip content="Help" side="bottom">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                setHelpOpen((open) => !open);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover-surface"
              style={{
                color: helpOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: helpOpen ? 'var(--color-accent-muted)' : 'transparent',
              }}
              aria-label="Help"
              aria-expanded={helpOpen}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </Tooltip>
          <HelpPopover isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>

        <div className="relative">
          <Tooltip content="Notifications" side="bottom">
            <button
              type="button"
              onClick={() => {
                setHelpOpen(false);
                setNotifOpen((open) => !open);
              }}
              className="relative flex h-7 w-7 items-center justify-center rounded-md transition-colors hover-surface"
              style={{
                color: notifOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: notifOpen ? 'var(--color-accent-muted)' : 'transparent',
              }}
              aria-label="Notifications"
              aria-expanded={notifOpen}
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
          </Tooltip>
          <NotificationsPopover isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
      </div>
    </div>
  );
};
