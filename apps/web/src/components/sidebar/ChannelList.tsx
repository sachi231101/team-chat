import React from 'react';
import { Hash, Lock, Plus } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Tooltip } from '../ui';

export const ChannelList: React.FC = () => {
  const { activeId, activeType, setActiveChannel, setCreateChannelModalOpen } = useUiStore();
  const { channels } = useWorkspace();

  return (
    <div className="space-y-px">
      {channels.map((channel) => {
        const isActive = activeType === 'channel' && activeId === channel.id;
        const hasUnread = Boolean(channel.unreadCount && channel.unreadCount > 0);

        return (
          <button
            key={channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className="group flex w-full items-center justify-between rounded-md px-2 py-[5px] text-xs transition-all"
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
            <div className="flex items-center gap-1.5 truncate min-w-0">
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
      })}

      {/* Add channel */}
      <button
        onClick={() => setCreateChannelModalOpen(true)}
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
        <span>Add channel</span>
      </button>
    </div>
  );
};
