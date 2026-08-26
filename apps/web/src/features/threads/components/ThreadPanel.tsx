import { useQuery } from '@tanstack/react-query';
import { X, MessageSquare } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useActiveMessages, useResizablePanel } from '../../../hooks';
import { chatService } from '../../../services';
import { MessageItem, MessageComposer } from '../../chat/components';
import { Button } from '../../../components/ui';
import { ResizeHandle } from '../../../components/common';
import { SummarizeMenu } from '../../../components/header/SummarizeMenu';

export const ThreadPanel: React.FC = () => {
  const activeThreadId = useUiStore((s) => s.activeThreadId);
  const closeThread = useUiStore((s) => s.closeThread);
  const activeId = useUiStore((s) => s.activeId);
  const activeType = useUiStore((s) => s.activeType);
  const { channels } = useWorkspace();
  const { messages } = useActiveMessages();

  const { width, isDragging, handleProps } = useResizablePanel({
    storageKey: 'team_chat_thread_panel_width',
    defaultWidth: 420,
    minWidth: 320,
    maxWidth: 780,
    direction: 'left',
  });

  const cachedParent = messages.find((m) => m.id === activeThreadId);

  const parentQuery = useQuery({
    queryKey: ['message', activeThreadId],
    queryFn: () => chatService.getMessage(activeThreadId!),
    enabled: Boolean(activeThreadId),
    initialData: cachedParent,
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

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col z-30 animate-in slide-in-right"
      style={{
        width: `${width}px`,
        background: 'var(--color-right-panel)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.25)',
      }}
    >
      <ResizeHandle
        direction="left"
        isDragging={isDragging}
        onMouseDown={handleProps.onMouseDown}
      />
      <div
        className="flex h-14 shrink-0 items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Thread
          </h3>
          {activeType === 'channel' && currentChannel && (
            <span className="truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              #{currentChannel.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <SummarizeMenu
            channelId={activeType === 'channel' ? activeId : undefined}
            conversationId={activeType === 'conversation' ? activeId : undefined}
            parentMessageId={activeThreadId ?? undefined}
          />
          <Button variant="ghost" size="icon" onClick={closeThread}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3">
        {parentQuery.isLoading && !parentMessage ? (
          <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Loading thread…
          </div>
        ) : parentQuery.isError || !parentMessage ? (
          <div className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Could not load this thread.
          </div>
        ) : (
          <>
            <div
              className="rounded-xl p-1"
              style={{
                background: 'var(--color-accent-muted)',
                border: '1px solid var(--color-active-border)',
              }}
            >
              <MessageItem message={parentMessage} isThreadReply />
            </div>

            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--color-border-subtle)' }} />
              </div>
              <span
                className="relative px-2.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: 'var(--color-right-panel)', color: 'var(--color-text-tertiary)' }}
              >
                {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
              </span>
            </div>

            {repliesQuery.isLoading ? (
              <div className="py-4 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Loading replies…
              </div>
            ) : replies.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                No replies yet. Be the first to respond!
              </div>
            ) : (
              replies.map((reply) => (
                <MessageItem key={reply.id} message={reply} isThreadReply />
              ))
            )}
          </>
        )}
      </div>

      {parentMessage && (
        <MessageComposer parentMessageId={activeThreadId} placeholder="Reply in thread..." />
      )}
    </aside>
  );
};
