import React, { useState, useEffect, useMemo } from 'react';
import { Users, Volume2 } from 'lucide-react';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { Avatar } from '../../../components/ui';
import { User } from '@team-chat/shared';

export interface MentionItem {
  id: string;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  status?: 'online' | 'busy' | 'away' | 'offline';
  isSpecial?: boolean;
}

export interface MentionDropdownProps {
  query: string;
  channelId?: string;
  conversationId?: string;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  query,
  channelId,
  conversationId,
  onSelect,
  onClose,
}) => {
  const [channelMembers, setChannelMembers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { users, conversations } = useWorkspace();

  // Load channel members or conversation participants
  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      if (channelId) {
        try {
          const members = await chatService.getChannelMembers(channelId);
          if (isMounted) setChannelMembers(members);
        } catch {
          // Fallback: local users
          if (isMounted) setChannelMembers(users);
        }
      } else if (conversationId) {
        const convo = conversations.find((c) => c.id === conversationId);
        if (convo && isMounted) {
          const participants = users.filter((u) => convo.participants.includes(u.id));
          setChannelMembers(participants);
        }
      } else {
        if (isMounted) setChannelMembers(users);
      }
    }

    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [channelId, conversationId, users, conversations]);

  // Build eligible items list
  const items: MentionItem[] = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();
    const list: MentionItem[] = [];

    // Only show actual human members (exclude agents and channels from @ mentions)
    const filteredMembers = channelMembers.filter((u) => !u.id.startsWith('usr-agent-'));

    const visible = filteredMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(cleanQuery) ||
        m.email.toLowerCase().includes(cleanQuery) ||
        (m.title && m.title.toLowerCase().includes(cleanQuery)),
    );

    visible.forEach((u) => {
      list.push({
        id: u.id,
        name: u.name,
        subtitle: u.title || u.email,
        avatarUrl: u.avatarUrl,
        status: u.status,
        isSpecial: false,
      });
    });

    return list;
  }, [query, channelId, channelMembers]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard events (up, down, enter, tab, escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (items[selectedIndex]) {
          e.preventDefault();
          onSelect(items[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [items, selectedIndex, onSelect, onClose]);

  if (items.length === 0) return null;

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
        <span>{channelId ? 'Channel Members' : 'Participants'}</span>
        <span className="font-mono text-[9px]">↑↓ to navigate</span>
      </div>

      <div className="p-1 space-y-0.5">
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors"
              style={{
                background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                color: isSelected ? 'var(--color-active-text)' : 'var(--color-text-primary)',
              }}
            >
              {item.isSpecial ? (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: item.name === 'channel' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                    color: item.name === 'channel' ? '#a78bfa' : '#38bdf8',
                  }}
                >
                  {item.name === 'channel' ? <Users className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </div>
              ) : (
                <Avatar
                  name={item.name}
                  src={item.avatarUrl}
                  size="xs"
                  status={item.status}
                  showStatus
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">
                    {item.isSpecial ? `@${item.name}` : item.name}
                  </span>
                  {item.isSpecial && (
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold">
                      All
                    </span>
                  )}
                  {item.id.startsWith('usr-agent-') && (
                    <span className="text-[9px] uppercase px-1 rounded bg-sky-500/20 text-sky-300 font-bold">
                      AI
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-[10px] text-theme-tertiary truncate">
                    {item.subtitle}
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
