import React from 'react';
import { Plus } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Avatar } from '../ui';
import type { Conversation, User } from '@team-chat/shared';

function isSelfConversation(convo: Conversation, currentUserId: string) {
  const unique = Array.from(new Set(convo.participants));
  return unique.length === 1 && unique[0] === currentUserId;
}

function dmRowStyle(isActive: boolean, hasUnread: boolean): React.CSSProperties {
  return {
    background: isActive ? 'var(--color-active-bg)' : 'transparent',
    color: isActive ? '#fff' : hasUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    fontWeight: hasUnread || isActive ? 600 : 400,
  };
}

export const DirectMessageList: React.FC = () => {
  const { activeId, activeType, setActiveConversation, setPeopleModalOpen } = useUiStore();
  const { conversations, users, currentUser } = useWorkspace();
  const { createConversation } = useChatMutations();

  const selfConversation = conversations.find((c) => isSelfConversation(c, currentUser.id));
  const otherConversations = conversations.filter((c) => !isSelfConversation(c, currentUser.id));
  const selfIsActive = Boolean(
    selfConversation && activeType === 'conversation' && activeId === selfConversation.id,
  );

  const openSelfNotes = () => {
    if (selfConversation) {
      setActiveConversation(selfConversation.id);
      return;
    }
    createConversation.mutate(currentUser.id);
  };

  return (
    <div className="space-y-px">
      <button
        type="button"
        onClick={openSelfNotes}
        className="flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-xs transition-all"
        style={dmRowStyle(selfIsActive, false)}
        onMouseEnter={(e) => {
          if (!selfIsActive)
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sidebar-hover)';
        }}
        onMouseLeave={(e) => {
          if (!selfIsActive)
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <Avatar
          name={currentUser.name}
          src={currentUser.avatarUrl}
          size="xs"
          status={currentUser.status}
          showStatus
        />
        <span className="truncate min-w-0">{currentUser.name}</span>
        <span className="shrink-0 font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
          you
        </span>
      </button>

      {otherConversations.map((convo) => {
        const otherUserId =
          convo.participants.find((id) => id !== currentUser.id) || convo.participants[0];
        const otherUser = users.find((u) => u.id === otherUserId);
        if (!otherUser) return null;

        const isActive = activeType === 'conversation' && activeId === convo.id;
        const hasUnread = Boolean(convo.unreadCount && convo.unreadCount > 0);

        return (
          <DmRow
            key={convo.id}
            user={otherUser}
            isActive={isActive}
            hasUnread={hasUnread}
            unreadCount={convo.unreadCount}
            onClick={() => setActiveConversation(convo.id)}
          />
        );
      })}

      <button
        type="button"
        onClick={() => setPeopleModalOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-[5px] text-xs transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sidebar-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }}
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
        <span>Invite people</span>
      </button>
    </div>
  );
};

const DmRow: React.FC<{
  user: User;
  isActive: boolean;
  hasUnread: boolean;
  unreadCount?: number;
  onClick: () => void;
}> = ({ user, isActive, hasUnread, unreadCount, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-md px-2 py-[5px] text-xs transition-all"
    style={dmRowStyle(isActive, hasUnread)}
    onMouseEnter={(e) => {
      if (!isActive)
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sidebar-hover)';
    }}
    onMouseLeave={(e) => {
      if (!isActive)
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
    }}
  >
    <div className="flex items-center gap-2 truncate min-w-0">
      <Avatar name={user.name} src={user.avatarUrl} size="xs" status={user.status} showStatus />
      <span className="truncate">{user.name}</span>
    </div>
    {hasUnread && !isActive && (
      <span
        className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
        style={{ background: 'var(--color-badge)', color: 'var(--color-badge-text)' }}
      >
        {unreadCount}
      </span>
    )}
  </button>
);
