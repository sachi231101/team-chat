import React from 'react';
import { Bell, CheckCheck, AtSign, MessageSquare, Heart, X } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { cn } from '../../lib/utils';
import { Button } from '../ui';

export interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
  const { setActiveChannel } = useUiStore();
  const { notifications } = useWorkspace();
  const { markNotificationAsRead, markAllNotificationsAsRead } = useChatMutations();

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const iconMap: Record<string, React.ReactNode> = {
    mention: <AtSign className="h-4 w-4 text-indigo-400" />,
    reply: <MessageSquare className="h-4 w-4 text-emerald-400" />,
    reaction: <Heart className="h-4 w-4 text-rose-400" />,
    direct_message: <MessageSquare className="h-4 w-4 text-sky-400" />,
    dm: <MessageSquare className="h-4 w-4 text-sky-400" />,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 top-14 z-50 w-80 sm:w-96 rounded-2xl border border-slate-700/80 bg-slate-900 p-4 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Notifications</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={markAllNotificationsAsRead.mutate}
                className="text-xs text-slate-400 hover:text-slate-200 gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No notifications yet</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead.mutate(notif.id);
                  if (notif.channelId) {
                    setActiveChannel(notif.channelId);
                    onClose();
                  }
                }}
                className={cn(
                  'flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors',
                  notif.unread ? 'bg-indigo-950/20 hover:bg-indigo-950/40' : 'hover:bg-slate-800/50',
                )}
              >
                <div className="mt-0.5 rounded-lg bg-slate-800 p-1.5 shrink-0">
                  {iconMap[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-100 truncate">{notif.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{notif.body}</p>
                </div>
                {notif.unread && (
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
