import React from 'react';
import { Star } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { ChannelRow } from './ChannelRow';

export const StarredChannelList: React.FC = () => {
  const starredChannelIds = useUiStore((s) => s.starredChannelIds);
  const { channels } = useWorkspace();

  const starredChannels = starredChannelIds
    .map((id) => channels.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (starredChannels.length === 0) return null;

  return (
    <div className="px-2 pb-2">
      <div className="mb-1 flex items-center gap-1.5 px-2">
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Starred
        </span>
      </div>
      <div className="space-y-px pl-1">
        {starredChannels.map((channel) => (
          <ChannelRow key={`starred-${channel.id}`} channel={channel} />
        ))}
      </div>
    </div>
  );
};
