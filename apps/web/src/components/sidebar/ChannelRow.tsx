import React, { useState, useRef, useEffect } from 'react';
import { Hash, Lock, Star, MoreVertical, Check } from 'lucide-react';
import { Channel } from '@team-chat/shared';
import { useUiStore } from '../../stores';

interface ChannelRowProps {
  channel: Channel;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({ channel }) => {
  const {
    activeId,
    activeType,
    setActiveChannel,
    starredChannelIds,
    toggleStarChannel,
    customSections,
    addChannelToCustomSection,
    removeChannelFromCustomSection,
  } = useUiStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isActive = activeType === 'channel' && activeId === channel.id;
  const isStarred = starredChannelIds.includes(channel.id);
  const hasUnread = Boolean(channel.unreadCount && channel.unreadCount > 0);

  const currentSection = customSections.find((s) => s.channelIds.includes(channel.id));

  return (
    <div
      className="group relative flex items-center rounded-md"
      style={{
        background: isActive ? 'var(--color-active-bg)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--color-sidebar-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <button
        type="button"
        onClick={() => setActiveChannel(channel.id)}
        className="flex min-w-0 flex-1 items-center justify-between rounded-md px-2.5 py-1.5 text-[14px] transition-all"
        style={{
          color: isActive
            ? 'var(--color-active-text)'
            : hasUnread
              ? 'var(--color-text-primary)'
              : 'var(--color-text-secondary)',
          fontWeight: hasUnread || isActive ? 600 : 400,
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

      {/* Sibling control — must not nest inside the row select button */}
      <div ref={menuRef} className="relative shrink-0 pr-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-opacity"
          aria-label="Channel options"
        >
          <MoreVertical className="h-3 w-3" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-48 rounded-xl p-1 shadow-2xl z-50 border animate-in fade-in zoom-in-95 text-left"
            style={{
              background: 'var(--color-modal)',
              borderColor: 'var(--color-border)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                toggleStarChannel(channel.id);
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-stone-200 hover:bg-white/5 transition-colors"
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-stone-400'}`} />
              <span>{isStarred ? 'Remove from Starred' : 'Star channel'}</span>
            </button>

            {customSections.length > 0 && (
              <>
                <div className="my-1 border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Move to Section
                </p>

                {customSections.map((sec) => {
                  const isAssigned = sec.id === currentSection?.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (isAssigned) {
                          removeChannelFromCustomSection(sec.id, channel.id);
                        } else {
                          addChannelToCustomSection(sec.id, channel.id);
                        }
                      }}
                      className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-stone-200 hover:bg-white/5 transition-colors"
                    >
                      <span className="truncate">📂 {sec.name}</span>
                      {isAssigned && <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                    </button>
                  );
                })}

                {currentSection && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      removeChannelFromCustomSection(currentSection.id, channel.id);
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-stone-400 hover:bg-white/5 hover:text-stone-200 transition-colors"
                  >
                    <span>Move back to Channels</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
