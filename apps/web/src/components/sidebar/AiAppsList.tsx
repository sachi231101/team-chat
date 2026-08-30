import React from 'react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Avatar } from '../ui';
import { isAgentUserId } from '../../utils/isAgentUserId';
import type { User } from '@team-chat/shared';

function appRowStyle(isActive: boolean, hasUnread: boolean): React.CSSProperties {
  return {
    background: isActive ? 'var(--color-active-bg)' : 'transparent',
    color: isActive
      ? 'var(--color-active-text)'
      : hasUnread
        ? 'var(--color-text-primary)'
        : 'var(--color-text-secondary)',
    fontWeight: hasUnread || isActive ? 600 : 400,
  };
}

export const AiAppsList: React.FC = () => {
  const { activeId, activeType, setActiveConversation } = useUiStore();
  const { conversations, users, currentUser } = useWorkspace();
  const { createConversation } = useChatMutations();

  const agents = users.filter((u) => isAgentUserId(u.id));

  const openAgent = (agentId: string) => {
    const existing = conversations.find((c) => {
      const unique = Array.from(new Set(c.participants));
      return (
        unique.length === 2 &&
        unique.includes(currentUser.id) &&
        unique.includes(agentId)
      );
    });

    if (existing) {
      setActiveConversation(existing.id);
      return;
    }

    createConversation.mutate(agentId);
  };

  if (agents.length === 0) {
    return (
      <p
        className="px-2.5 py-1.5 text-xs"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        No AI apps yet
      </p>
    );
  }

  return (
    <div className="space-y-px">
      {agents.map((agent) => {
        const convo = conversations.find((c) => {
          const unique = Array.from(new Set(c.participants));
          return (
            unique.length === 2 &&
            unique.includes(currentUser.id) &&
            unique.includes(agent.id)
          );
        });

        const isActive = Boolean(
          convo && activeType === 'conversation' && activeId === convo.id,
        );
        const hasUnread = Boolean(convo?.unreadCount && convo.unreadCount > 0);

        return (
          <AppRow
            key={agent.id}
            user={agent}
            isActive={isActive}
            hasUnread={hasUnread}
            unreadCount={convo?.unreadCount}
            onClick={() => openAgent(agent.id)}
          />
        );
      })}
    </div>
  );
};

const AppRow: React.FC<{
  user: User;
  isActive: boolean;
  hasUnread: boolean;
  unreadCount?: number;
  onClick: () => void;
}> = ({ user, isActive, hasUnread, unreadCount, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[14px] transition-all"
    style={appRowStyle(isActive, hasUnread)}
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
