import React from 'react';
import { ChevronLeft, ChevronRight, Search, HelpCircle, Bell, Menu, Bot, Sun, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Tooltip } from '../ui';

export const GlobalTopBar: React.FC = () => {
  const navigate = useNavigate();
  const {
    setSearchModalOpen,
    toggleSidebar,
    navIndex,
    navStack,
    aiPanelOpen,
    toggleAiPanel,
    setDailyBriefingOpen,
    setMultiAgentStudioOpen,
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
      {/* Left: back / forward / history */}
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

      {/* Right: AI Assistant + Daily Briefing + Swarm + Help + Bell */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Daily Briefing button */}
        <Tooltip content="Personal Daily Briefing" side="bottom">
          <button
            type="button"
            onClick={() => setDailyBriefingOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 hover:scale-105 transition-all"
            aria-label="Open Daily Briefing"
          >
            <Sun className="h-4 w-4 text-amber-400" />
          </button>
        </Tooltip>

        {/* Multi-Agent Swarm Studio button */}
        <Tooltip content="Multi-Agent Swarm Studio" side="bottom">
          <button
            type="button"
            onClick={() => setMultiAgentStudioOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/25 hover:scale-105 transition-all"
            aria-label="Open Multi-Agent Studio"
          >
            <Users className="h-4 w-4 text-cyan-400" />
          </button>
        </Tooltip>

        {/* AI Assistant button */}
        <Tooltip content={aiPanelOpen ? "Close AI Assistant" : "Open AI Assistant"} side="bottom">
          <button
            type="button"
            onClick={toggleAiPanel}
            className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              aiPanelOpen
                ? 'ring-2 ring-violet-400 scale-105 shadow-md shadow-violet-500/25'
                : 'hover:opacity-90 hover:scale-105'
            }`}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
              color: '#ffffff',
            }}
            aria-label="Toggle AI Assistant"
          >
            <Bot className="h-4 w-4 drop-shadow-sm" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
          </button>
        </Tooltip>

        <button
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover-surface"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <button
          className="relative flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Notifications"
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
      </div>
    </div>
  );
};

