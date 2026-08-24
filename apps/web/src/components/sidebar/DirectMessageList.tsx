import React from 'react';
import { Plus } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Avatar } from '../ui';

export const DirectMessageList: React.FC = () => {
  const { conversations, users, currentUser, activeId, activeType, setActiveConversation, setPeopleModalOpen } =
    useChatDataStore();

  return (
    <div className="space-y-px">
      {conversations.map((convo) => {
        const otherUserId =
          convo.participants.find((id) => id !== currentUser.id) || convo.participants[0];
        const otherUser = users.find((u) => u.id === otherUserId);
        if (!otherUser) return null;

        const isActive = activeType === 'conversation' && activeId === convo.id;
        const hasUnread = Boolean(convo.unreadCount && convo.unreadCount > 0);

        return (
          <button
            key={convo.id}
            onClick={() => setActiveConversation(convo.id)}
            className="flex w-full items-center justify-between rounded-md px-2 py-[5px] text-xs transition-all"
            style={{
              background: isActive ? 'var(--color-active-bg)' : 'transparent',
              color: isActive
                ? '#fff'
                : hasUnread
                ? 'var(--color-text-primary)'
                : 'var(--color-text-secondary)',
              fontWeight: hasUnread || isActive ? 600 : 400,
            }}
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
              <Avatar name={otherUser.name} src={otherUser.avatarUrl} size="xs" status={otherUser.status} showStatus />
              <span className="truncate">{otherUser.name}</span>
            </div>

            {hasUnread && !isActive && (
              <span
                className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: 'var(--color-badge)', color: 'var(--color-badge-text)' }}
              >
                {convo.unreadCount}
              </span>
            )}
          </button>
        );
      })}

      {/* New message */}
      <button
        onClick={() => setPeopleModalOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-[5px] text-xs transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
        }}
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
        <span>New message</span>
      </button>
    </div>
  );
};
