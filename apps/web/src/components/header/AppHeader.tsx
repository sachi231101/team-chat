import React, { useState } from 'react';
import {
  Hash,
  Lock,
  Star,
  Phone,
  Video,
  Info,
  MoreHorizontal,
  PanelRight,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Avatar, Tooltip } from '../ui';
import { NotificationsPopover } from './NotificationsPopover';

type Tab = 'messages' | 'files' | 'pinned';

export const AppHeader: React.FC = () => {
  const [starred, setStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [notifOpen, setNotifOpen] = useState(false);

  const {
    activeId,
    activeType,
    toggleDetailsPanel,
    detailsPanelOpen,
  } = useUiStore();
  const { channels, conversations, users, currentUser } = useWorkspace();

  const currentChannel = channels.find((c) => c.id === activeId);
  const currentConversation = conversations.find((c) => c.id === activeId);
  const otherUser =
    activeType === 'conversation' && currentConversation
      ? users.find(
          (u) =>
            u.id ===
            (currentConversation.participants.find((id) => id !== currentUser.id) ||
              currentConversation.participants[0]),
        )
      : null;


  const tabs: { id: Tab; label: string }[] = [
    { id: 'messages', label: 'Messages' },
    { id: 'files', label: 'Files' },
    { id: 'pinned', label: 'Pinned' },
  ];

  const iconBtn = (icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean) => (
    <Tooltip content={label} side="bottom">
      <button
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        style={{
          background: active ? 'var(--color-active-bg)' : 'transparent',
          color: active ? '#fff' : 'var(--color-text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sidebar-hover)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
          }
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <header
      className="w-full shrink-0"
      style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Row 1: Title + actions */}
      <div className="flex h-[49px] items-center justify-between px-4 gap-2">
        {/* Left: star + name + subtitle */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setStarred(!starred)}
            className="shrink-0 transition-colors"
            style={{ color: starred ? 'var(--color-pin)' : 'var(--color-text-tertiary)' }}
          >
            <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
          </button>

          {activeType === 'channel' && currentChannel ? (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {currentChannel.type === 'private' ? (
                  <Lock className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                ) : (
                  <Hash className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                )}
                <h2 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {currentChannel.name}
                </h2>
              </div>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {currentChannel.description
                  ? `${currentChannel.description} • `
                  : 'Company-wide discussions • '}
                <span>24 members</span>
              </p>
            </div>
          ) : otherUser ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={otherUser.name} src={otherUser.avatarUrl} size="xs" status={otherUser.status} showStatus />
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {otherUser.name}
                  {otherUser.id === currentUser.id ? (
                    <span className="ml-1.5 font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
                      you
                    </span>
                  ) : null}
                </h2>
                <p className="text-[11px] capitalize" style={{ color: 'var(--color-online)' }}>
                  {otherUser.status === 'online' ? 'Online' : otherUser.status}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {iconBtn(<Phone className="h-4 w-4" />, 'Voice call')}
          {iconBtn(<Video className="h-4 w-4" />, 'Video call')}
          {iconBtn(<Info className="h-4 w-4" />, 'Channel info')}
          <div className="relative">
            {iconBtn(<MoreHorizontal className="h-4 w-4" />, 'More', () => setNotifOpen(!notifOpen))}
            <NotificationsPopover isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
          {iconBtn(<PanelRight className="h-4 w-4" />, detailsPanelOpen ? 'Hide details' : 'Channel details', toggleDetailsPanel, detailsPanelOpen)}
        </div>
      </div>

      {/* Row 2: Tabs — Messages / Files / Pinned */}
      <div className="flex items-center gap-1 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-2 text-xs font-semibold border-b-2 transition-colors"
            style={{
              borderBottomColor: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
