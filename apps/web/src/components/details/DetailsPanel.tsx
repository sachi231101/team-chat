import React, { useState } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import {
  useWorkspace,
  useActiveMessages,
  useContextPinnedMessagesQuery,
  useChatMutations,
  useResizablePanel,
  useChannelMembersQuery,
} from '../../hooks';
import { Avatar } from '../ui';
import { ResizeHandle } from '../common';

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

export const DetailsPanel: React.FC = () => {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const {
    activeId,
    activeType,
    detailsPanelOpen,
    toggleDetailsPanel,
    setChatHeaderTab,
    setAddMembersModalOpen,
    setSettingsModalOpen,
  } = useUiStore();  const { channels, conversations, users, currentUser } = useWorkspace();
  const { messages } = useActiveMessages();
  const pinnedQuery = useContextPinnedMessagesQuery();
  const { leaveChannel } = useChatMutations();

  const channelIdForMembers =
    detailsPanelOpen && activeType === 'channel' ? activeId : null;
  const membersQuery = useChannelMembersQuery(channelIdForMembers);

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
  const pinnedCount = pinnedQuery.data?.length ?? channelMessages.filter((m) => m.pinned).length;
  const filesCount = channelMessages.reduce(
    (acc, m) => acc + (m.attachments?.length ?? 0),
    0,
  );
  const linksCount = channelMessages.reduce((acc, m) => {
    const matches = m.content.match(URL_REGEX);
    return acc + (matches?.length ?? 0);
  }, 0);

  const openView = (tab: 'files' | 'pinned' | 'links') => {
    setChatHeaderTab(tab);
  };

  const handleLeaveChannel = () => {
    if (!currentChannel) return;
    const confirmed = window.confirm(`Leave #${currentChannel.name}? You can rejoin public channels later.`);
    if (!confirmed) return;
    leaveChannel.mutate(currentChannel.id);
  };

  const isChannel = activeType === 'channel' && currentChannel;
  const name = isChannel ? currentChannel.name : otherUser?.name ?? '';
  const description = isChannel
    ? currentChannel.description || 'Company-wide announcements and discussions.'
    : '';

  const channelMembers = membersQuery.data ?? [];
  const memberCount = isChannel
    ? channelMembers.length || currentChannel.membersCount || 0
    : currentConversation?.participants.length ?? 0;
  const previewMembers = showAllMembers ? channelMembers : channelMembers.slice(0, 5);
  const extraMembers = Math.max(0, channelMembers.length - 5);
  const creator = isChannel
    ? users.find((u) => u.id === currentChannel.createdById) ||
      channelMembers.find((u) => u.id === currentChannel.createdById)
    : null;
  const createdLabel = isChannel
    ? `Created by ${creator?.name ?? 'Unknown'}${
        currentChannel.createdAt
          ? ` on ${new Date(currentChannel.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`
          : ''
      }`
    : '';

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

  const { width, isDragging, handleProps } = useResizablePanel({
    storageKey: 'team_chat_details_panel_width',
    defaultWidth: 320,
    minWidth: 260,
    maxWidth: 600,
    direction: 'left',
  });

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col overflow-y-auto animate-in slide-in-right"
      style={{
        width: `${width}px`,
        background: 'var(--color-right-panel)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      <ResizeHandle
        direction="left"
        isDragging={isDragging}
        onMouseDown={handleProps.onMouseDown}
      />
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
        {isChannel && createdLabel && (
          <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {createdLabel}
          </p>
        )}
      </div>

      {/* Members */}
      {isChannel && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {membersQuery.isLoading ? 'Members' : `${memberCount} ${memberCount === 1 ? 'Member' : 'Members'}`}
            </span>
            {channelMembers.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllMembers((v) => !v)}
                className="text-[11px] font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                {showAllMembers ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
          {membersQuery.isLoading ? (
            <div className="flex items-center gap-2 py-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading members…
            </div>
          ) : membersQuery.isError ? (
            <p className="text-[11px]" style={{ color: 'var(--color-danger)' }}>
              Couldn’t load members
            </p>
          ) : channelMembers.length === 0 ? (
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              No members yet
            </p>
          ) : showAllMembers ? (
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-0.5">
              {channelMembers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 rounded-lg px-1 py-1">
                  <Avatar name={u.name} src={u.avatarUrl} size="xs" status={u.status} showStatus />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {u.name}
                      {u.id === currentUser.id ? ' (you)' : ''}
                    </p>
                    {u.title && (
                      <p className="truncate text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {u.title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {previewMembers.map((u) => (
                <div
                  key={u.id}
                  className="h-7 w-7 rounded-full overflow-hidden ring-1 ring-[var(--color-border)]"
                  title={u.name}
                >
                  <Avatar name={u.name} src={u.avatarUrl} size="xs" status={u.status} />
                </div>
              ))}
              {extraMembers > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllMembers(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: 'var(--color-elevated)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                  title="See all members"
                >
                  +{extraMembers}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Channel media — opened from details, not header tabs */}
      <div className="py-1">
        <p
          className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          In this chat
        </p>
        {actionRow(
          <FileText className="h-3.5 w-3.5" />,
          'Files',
          filesCount,
          false,
          () => openView('files'),
        )}
        {actionRow(
          <Pin className="h-3.5 w-3.5" />,
          'Pinned',
          pinnedCount,
          false,
          () => openView('pinned'),
        )}
        {actionRow(
          <Link2 className="h-3.5 w-3.5" />,
          'Links',
          linksCount,
          false,
          () => openView('links'),
        )}
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
        {actionRow(
          <Bell className="h-3.5 w-3.5" />,
          'Notification preferences',
          undefined,
          false,
          () => setSettingsModalOpen(true),
        )}
        {isChannel &&
          actionRow(
            <UserPlus className="h-3.5 w-3.5" />,
            'Add members',
            undefined,
            false,
            () => setAddMembersModalOpen(true),
          )}
        {dividerRow}
        {actionRow(
          <LogOut className="h-3.5 w-3.5" />,
          isChannel ? 'Leave channel' : 'Block user',
          undefined,
          true,
          isChannel ? handleLeaveChannel : undefined,
        )}
      </div>
    </aside>
  );
};
