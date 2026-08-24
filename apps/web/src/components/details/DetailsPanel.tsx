import React from 'react';
import {
  X,
  Hash,
  Lock,
  FileText,
  Pin,
  Link2,
  ChevronRight,
  Bell,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useActiveMessages } from '../../hooks';
import { Avatar } from '../ui';

export const DetailsPanel: React.FC = () => {
  const { activeId, activeType, detailsPanelOpen, toggleDetailsPanel } = useUiStore();
  const { channels, conversations, users, currentUser } = useWorkspace();
  const { messages } = useActiveMessages();

  if (!detailsPanelOpen) return null;

  const currentChannel = channels.find((c) => c.id === activeId);
  const currentConversation = conversations.find((c) => c.id === activeId);
  const otherUser =
    activeType === 'conversation' && currentConversation
      ? users.find(
          (u) =>
            u.id ===
            (currentConversation.participants.find((id) => id !== currentUser.id) ||
              currentConversation.participants[0]),
        )
      : null;

  const channelMessages = messages.filter(
    (m) => m.channelId === activeId || m.conversationId === activeId,
  );
  const pinnedCount = channelMessages.filter((m) => m.pinned).length;
  const filesCount = channelMessages.reduce(
    (acc, m) => acc + (m.attachments?.length ?? 0),
    0,
  );

  const isChannel = activeType === 'channel' && currentChannel;
  const name = isChannel ? currentChannel.name : otherUser?.name ?? '';
  const description = isChannel
    ? currentChannel.description || 'Company-wide announcements and discussions.'
    : '';

  // Show the first 5 users as members
  const visibleMembers = users.slice(0, 5);
  const extraMembers = Math.max(0, users.length - 5);

  const dividerRow = (
    <div className="h-px mx-0 my-1" style={{ background: 'var(--color-border-subtle)' }} />
  );

  const actionRow = (
    icon: React.ReactNode,
    label: string,
    value?: string | number,
    danger?: boolean,
    onClick?: () => void,
  ) => (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
      style={{ color: danger ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = danger
          ? 'var(--color-danger-muted)'
          : 'var(--color-sidebar-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <span className="shrink-0" style={{ color: danger ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
        {icon}
      </span>
      <span className="flex-1 text-left text-xs font-medium">{label}</span>
      {value !== undefined && (
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
          {value}
        </span>
      )}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
    </button>
  );

  return (
    <aside
      className="flex h-full w-[240px] shrink-0 flex-col overflow-y-auto animate-in slide-in-right"
      style={{ background: 'var(--color-right-panel)', borderLeft: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {isChannel ? 'Channel details' : 'Profile'}
        </span>
        <button
          onClick={toggleDetailsPanel}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Channel/DM Name */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2 mb-1">
          {isChannel ? (
            currentChannel.type === 'private' ? (
              <Lock className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
            ) : (
              <Hash className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
            )
          ) : (
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <Avatar name={name} src={otherUser?.avatarUrl} size="xs" status={otherUser?.status} showStatus />
            </div>
          )}
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {name}
          </span>
        </div>
        {description && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
        {isChannel && (
          <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Created by {users[0]?.name ?? 'Unknown'} on Jan 10, 2024
          </p>
        )}
      </div>

      {/* Members */}
      {isChannel && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {users.length} Members
            </span>
            <button className="text-[11px] font-semibold" style={{ color: 'var(--color-accent)' }}>
              See all
            </button>
          </div>
          <div className="flex items-center gap-1">
            {visibleMembers.map((u) => (
              <div key={u.id} className="h-7 w-7 rounded-full overflow-hidden ring-1 ring-[var(--color-border)]">
                <Avatar name={u.name} src={u.avatarUrl} size="xs" status={u.status} />
              </div>
            ))}
            {extraMembers > 0 && (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                +{extraMembers}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="py-1">
        {actionRow(<FileText className="h-3.5 w-3.5" />, 'Files', filesCount || 12)}
        {actionRow(<Pin className="h-3.5 w-3.5" />, 'Pinned', pinnedCount || 4)}
        {actionRow(<Link2 className="h-3.5 w-3.5" />, 'Links', 8)}
      </div>

      {dividerRow}

      {/* Description */}
      {isChannel && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Description
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {description || 'This channel is for team-wide updates, important announcements and general discussions.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="py-1">
        {actionRow(<Bell className="h-3.5 w-3.5" />, 'Notification preferences')}
        {isChannel && actionRow(<UserPlus className="h-3.5 w-3.5" />, 'Add members')}
        {dividerRow}
        {actionRow(<LogOut className="h-3.5 w-3.5" />, isChannel ? 'Leave channel' : 'Block user', undefined, true)}
      </div>
    </aside>
  );
};
