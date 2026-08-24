import React from 'react';
import { Hash, Lock } from 'lucide-react';
import { Channel } from '@team-chat/shared';
import { useUiStore } from '../../stores';

interface ChannelRowProps {
  channel: Channel;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({ channel }) => {
  const { activeId, activeType, setActiveChannel } = useUiStore();
  const isActive = activeType === 'channel' && activeId === channel.id;
  const hasUnread = Boolean(channel.unreadCount && channel.unreadCount > 0);

  return (
    <button
      type="button"
      onClick={() => setActiveChannel(channel.id)}
      className="group flex w-full items-center justify-between rounded-md px-2 py-[5px] text-xs transition-all"
      style={{
        background: isActive ? 'var(--color-active-bg)' : 'transparent',
        color: isActive
          ? 'var(--color-active-text)'
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
      <div className="flex min-w-0 items-center gap-1.5 truncate">
        {channel.type === 'private' ? (
          <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
        ) : (
          <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
        )}
        <span className="truncate">{channel.name}</span>
      </div>

      {hasUnread && !isActive && (
        <span
          className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ background: 'var(--color-badge)', color: 'var(--color-badge-text)' }}
        >
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
};
