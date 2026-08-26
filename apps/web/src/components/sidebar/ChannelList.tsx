import React from 'react';
import { Plus } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { ChannelRow } from './ChannelRow';

export const ChannelList: React.FC = () => {
  const { setCreateChannelModalOpen, starredChannelIds, customSections } = useUiStore();
  const { channels } = useWorkspace();

  const customSectionChannelIds = customSections.flatMap((s) => s.channelIds);
  const unassignedChannels = channels.filter(
    (c) => !starredChannelIds.includes(c.id) && !customSectionChannelIds.includes(c.id),
  );

  return (
    <div className="space-y-px">
      {unassignedChannels.map((channel) => (
        <ChannelRow key={channel.id} channel={channel} />
      ))}

      <button
        type="button"
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
