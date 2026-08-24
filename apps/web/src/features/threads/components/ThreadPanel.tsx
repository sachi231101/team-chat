import { useQuery } from '@tanstack/react-query';
import { X, MessageSquare } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { MessageItem, MessageComposer } from '../../chat/components';
import { Button } from '../../../components/ui';

export const ThreadPanel: React.FC = () => {
  const activeThreadId = useUiStore((s) => s.activeThreadId);
  const closeThread = useUiStore((s) => s.closeThread);
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);
  const { channels } = useWorkspace();
  const parentQuery = useQuery({
    queryKey: ['message', activeThreadId],
    queryFn: () => chatService.getMessage(activeThreadId!),
    enabled: Boolean(activeThreadId),
  });
  const repliesQuery = useQuery({
    queryKey: ['message-replies', activeThreadId],
    queryFn: () => chatService.getThreadReplies(activeThreadId!),
    enabled: Boolean(activeThreadId),
  });

  if (!activeThreadId) return null;

  const parentMessage = parentQuery.data;
  const replies = repliesQuery.data ?? [];
  const currentChannel = channels.find((c) => c.id === activeId);

  if (!parentMessage) return null;

  return (
    <aside className="flex h-full w-80 sm:w-96 flex-col border-l border-slate-800/80 bg-slate-950/60 shadow-2xl backdrop-blur-md z-20">
      <div className="flex h-14 items-center justify-between border-b border-slate-800/80 px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Thread</h3>
          {activeType === 'channel' && currentChannel && (
            <span className="text-xs text-slate-400">#{currentChannel.name}</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={closeThread}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3">
        <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-1">
          <MessageItem message={parentMessage} isThreadReply />
        </div>

        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-950 px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
        </div>

        {replies.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No replies in this thread yet. Be the first to respond!
          </div>
        ) : (
          replies.map((reply) => (
            <MessageItem key={reply.id} message={reply} isThreadReply />
          ))
        )}
      </div>

      <MessageComposer parentMessageId={activeThreadId} placeholder="Reply in thread..." />
    </aside>
  );
};
