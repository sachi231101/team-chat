import React, { useState } from 'react';
import {
  Hash,
  Lock,
  Star,
  PanelRight,
  Search,
  MessageSquare,
  CheckSquare,
  BookmarkCheck,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useContextActionsQuery, useContextDecisionsQuery, useChannelMembersQuery } from '../../hooks';
import { Avatar, Tooltip } from '../ui';
import { SummarizeMenu } from './SummarizeMenu';
import { AskAiMenu } from './AskAiMenu';

export const AppHeader: React.FC = () => {
  const [isSelfStarred, setIsSelfStarred] = useState(false);

  const {
    activeId,
    activeType,
    chatHeaderTab,
    setChatHeaderTab,
    toggleDetailsPanel,
    detailsPanelOpen,
    starredChannelIds,
    toggleStarChannel,
    setSearchModalOpen,
  } = useUiStore();
  const { channels, conversations, users, currentUser } = useWorkspace();
  const membersQuery = useChannelMembersQuery(activeType === 'channel' ? activeId : null);
  const actionsQuery = useContextActionsQuery();
  const decisionsQuery = useContextDecisionsQuery();

  const actionCount = actionsQuery.data?.length ?? 0;
  const decisionCount = decisionsQuery.data?.length ?? 0;

  const currentChannel = channels.find((c) => c.id === activeId);
  const isStarred = activeType === 'channel' && currentChannel
    ? starredChannelIds.includes(currentChannel.id)
    : false;
  const currentConversation = conversations.find((c) => c.id === activeId);
  const isSelf = Boolean(
    activeType === 'conversation' &&
    currentConversation &&
    (currentConversation.participants.length === 1 ||
      (currentConversation.participants.length === 2 &&
        currentConversation.participants[0] === currentUser.id &&
        currentConversation.participants[1] === currentUser.id)),
  );

  const otherUser =
    activeType === 'conversation' && currentConversation
      ? users.find(
          (u) =>
            u.id ===
            (currentConversation.participants.find((id) => id !== currentUser.id) ||
              currentConversation.participants[0]),
        )
      : null;

  const isSelfConvo = isSelf || (otherUser && otherUser.id === currentUser.id);

  const tabs: {
    id: 'messages' | 'actions' | 'decisions';
    label: string;
    count?: number;
    icon?: typeof MessageSquare;
  }[] = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'actions', label: 'Actions', count: actionCount, icon: CheckSquare },
    { id: 'decisions', label: 'Decisions', count: decisionCount, icon: BookmarkCheck },
  ];

  const iconBtn = (icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean) => (
    <Tooltip content={label} side="bottom">
      <button
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        style={{
          background: active ? 'var(--color-active-bg)' : 'transparent',
          color: active ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sidebar-hover)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
          }
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );

  const userInitial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <header
      className="w-full shrink-0"
      style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Row 1: Title + actions */}
      <div className="flex h-[49px] items-center justify-between px-4 gap-2">
        {/* Left: star + name + subtitle */}
        <div className="flex items-center gap-2 min-w-0">
          {activeType === 'channel' && currentChannel ? (
            <button
              type="button"
              onClick={() => toggleStarChannel(currentChannel.id)}
              className="shrink-0 transition-colors"
              style={{ color: isStarred ? 'var(--color-pin)' : 'var(--color-text-tertiary)' }}
              title={isStarred ? 'Unstar channel' : 'Star channel'}
            >
              <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
            </button>
          ) : isSelfConvo ? (
            <button
              type="button"
              onClick={() => setIsSelfStarred((p) => !p)}
              className="shrink-0 transition-colors"
              style={{ color: isSelfStarred ? '#eab308' : 'var(--color-text-tertiary)' }}
              title={isSelfStarred ? 'Unstar' : 'Star'}
            >
              <Star className={`h-4 w-4 ${isSelfStarred ? 'fill-current' : ''}`} />
            </button>
          ) : (
            <span className="w-4" />
          )}

          {activeType === 'channel' && currentChannel ? (
            <button
              type="button"
              onClick={toggleDetailsPanel}
              className="flex flex-col items-start min-w-0 text-left rounded-lg p-1 -ml-1 hover-surface transition-colors cursor-pointer group"
              title="Click to view channel details"
            >
              <div className="flex items-center gap-1.5">
                {currentChannel.type === 'private' ? (
                  <Lock className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                ) : (
                  <Hash className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                )}
                <h2 className="text-sm font-bold truncate group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                  {currentChannel.name}
                </h2>
              </div>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {currentChannel.description
                  ? `${currentChannel.description} • `
                  : ''}
                <span>
                  {membersQuery.data?.length ?? currentChannel.membersCount ?? 0}{' '}
                  {(membersQuery.data?.length ?? currentChannel.membersCount ?? 0) === 1
                    ? 'member'
                    : 'members'}
                </span>
              </p>
            </button>
          ) : isSelfConvo ? (
            <button
              type="button"
              onClick={toggleDetailsPanel}
              className="flex items-center gap-2 min-w-0 text-left rounded-lg p-1 -ml-1 hover-surface transition-colors cursor-pointer group"
              title="Click to view details"
            >
              <div className="relative shrink-0">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white shadow-sm"
                  style={{ background: '#9333ea' }}
                >
                  {userInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-slate-900 bg-emerald-500" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-sm font-bold truncate group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                  {currentUser.name}
                </h2>
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              </div>
            </button>
          ) : otherUser ? (
            <button
              type="button"
              onClick={toggleDetailsPanel}
              className="flex items-center gap-2 min-w-0 text-left rounded-lg p-1 -ml-1 hover-surface transition-colors cursor-pointer group"
              title="Click to view details"
            >
              <Avatar name={otherUser.name} src={otherUser.avatarUrl} size="xs" status={otherUser.status} showStatus />
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                  {otherUser.name}
                </h2>
                <p className="text-[11px] capitalize" style={{ color: 'var(--color-online)' }}>
                  {otherUser.status === 'online' ? 'Online' : otherUser.status}
                </p>
              </div>
            </button>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {iconBtn(<Search className="h-4 w-4" />, 'Search messages', () => setSearchModalOpen(true))}
          <AskAiMenu
            channelId={activeType === 'channel' ? activeId : undefined}
            conversationId={activeType === 'conversation' ? activeId : undefined}
          />
          <SummarizeMenu
            channelId={activeType === 'channel' ? activeId : undefined}
            conversationId={activeType === 'conversation' ? activeId : undefined}
          />
          {iconBtn(<PanelRight className="h-4 w-4" />, detailsPanelOpen ? 'Hide details' : 'Details', toggleDetailsPanel, detailsPanelOpen)}
        </div>
      </div>

      {/* Row 2: Primary tabs — utilities live in Details (Files / Pinned / Links) */}
      <div className="flex items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = chatHeaderTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChatHeaderTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors"
                style={{
                  borderBottomColor: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                }}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                    style={{
                      background: 'var(--color-elevated)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {(chatHeaderTab === 'files' || chatHeaderTab === 'pinned' || chatHeaderTab === 'links') && (
          <button
            type="button"
            onClick={() => setChatHeaderTab('messages')}
            className="mb-0.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Back to messages
          </button>
        )}
      </div>
    </header>
  );
};
