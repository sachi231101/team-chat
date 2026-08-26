import React from 'react';
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
    <div className="space-y-px pl-1">
      {starredChannels.map((channel) => (
        <ChannelRow key={`starred-${channel.id}`} channel={channel} />
      ))}
    </div>
  );
};
