import React, { useState } from 'react';
import { Bell, AtSign, MessageSquare, Heart, CheckCheck, ExternalLink } from 'lucide-react';
import { useChatDataStore } from '../../../stores';
import { formatTimestamp } from '../../../utils';

type ActivityFilter = 'all' | 'mentions' | 'replies' | 'reactions';

export const ActivityView: React.FC = () => {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const {
    notifications,
    channels,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveChannel,
    setActiveRailTab,
  } = useChatDataStore();

  const filtered = notifications.filter((item) => {
    if (filter === 'mentions') return item.type === 'mention';
    if (filter === 'replies') return item.type === 'reply';
    if (filter === 'reactions') return item.type === 'reaction';
    return true;
  });

  const iconMap: Record<string, React.ReactNode> = {
    mention: <AtSign className="h-4 w-4 text-indigo-400" />,
    reply: <MessageSquare className="h-4 w-4 text-emerald-400" />,
    reaction: <Heart className="h-4 w-4 text-rose-400" />,
    direct_message: <MessageSquare className="h-4 w-4 text-sky-400" />,
    dm: <MessageSquare className="h-4 w-4 text-sky-400" />,
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      {/* Header */}
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Activity Feed
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)' }}
          >
            {notifications.filter((n) => n.unread).length} unread
          </span>
        </div>

        <button
          onClick={() => markAllNotificationsAsRead()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-accent)' }}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex items-center gap-2 px-6 py-2"
        style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-header)' }}
      >
        {(['all', 'mentions', 'replies', 'reactions'] as ActivityFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all"
            style={{
              background: filter === tab ? 'var(--color-accent-muted)' : 'transparent',
              color: filter === tab ? '#ffffff' : 'var(--color-text-secondary)',
              border: filter === tab ? '1px solid var(--color-active-border)' : '1px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-12 w-12 opacity-30 mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              No activity in this view
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              When teammates mention you, reply to your threads, or react to your messages, they’ll show up here.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                markNotificationAsRead(item.id);
                if (item.channelId) {
                  setActiveChannel(item.channelId);
                  setActiveRailTab('home');
                }
              }}
              className="group flex items-start gap-3.5 rounded-xl p-3.5 cursor-pointer transition-all shadow-sm"
              style={{
                background: item.unread ? 'rgba(124, 58, 237, 0.12)' : 'var(--color-elevated)',
                border: item.unread ? '1px solid var(--color-active-border)' : '1px solid var(--color-border)',
              }}
            >
              <div className="mt-0.5 rounded-lg p-2 shrink-0" style={{ background: 'var(--color-input)' }}>
                {iconMap[item.type] || <Bell className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                    {item.time}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.body}
                </p>
              </div>

              {item.unread && (
                <span className="h-2 w-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-accent)' }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
