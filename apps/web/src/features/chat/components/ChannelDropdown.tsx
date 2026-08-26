import React, { useState, useEffect, useMemo } from 'react';
import { Hash, Lock } from 'lucide-react';
import { useWorkspace } from '../../../hooks';
import { Channel } from '@team-chat/shared';

export interface ChannelDropdownProps {
  query: string;
  onSelect: (channel: Channel) => void;
  onClose: () => void;
}

export const ChannelDropdown: React.FC<ChannelDropdownProps> = ({
  query,
  onSelect,
  onClose,
}) => {
  const { channels } = useWorkspace();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const cleanQuery = query.toLowerCase().replace(/^#/, '').trim();

  const filteredChannels = useMemo(() => {
    if (!cleanQuery) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQuery) ||
        (c.description && c.description.toLowerCase().includes(cleanQuery)),
    );
  }, [channels, cleanQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredChannels.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredChannels.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredChannels.length) % filteredChannels.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredChannels[selectedIndex]) {
          e.preventDefault();
          onSelect(filteredChannels[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredChannels, selectedIndex, onSelect, onClose]);

  if (filteredChannels.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-3 mb-2 w-72 max-h-64 overflow-y-auto rounded-xl shadow-2xl border z-50 animate-in zoom-in-95"
      style={{
        background: 'var(--color-elevated)',
        borderColor: 'var(--color-border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-tertiary)' }}
      >
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-emerald-400" />
          <span>Channels</span>
        </span>
        <span className="font-mono text-[9px]">↑↓ to navigate · ↵ to select</span>
      </div>

      <div className="p-1 space-y-0.5">
        {filteredChannels.map((channel, idx) => {
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={channel.id}
              type="button"
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => onSelect(channel)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors"
              style={{
                background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                color: isSelected ? 'var(--color-active-text)' : 'var(--color-text-primary)',
              }}
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: 'var(--color-input)' }}
              >
                {channel.type === 'private' ? (
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Hash className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  #{channel.name}
                </p>
                {channel.description && (
                  <p className="text-[10px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                    {channel.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
