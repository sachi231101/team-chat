import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Trash2,
  CircleDot,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useContextActionsQuery, useChatMutations, useWorkspace } from '../../../hooks';
import { ActionItem, ActionItemStatus } from '@team-chat/shared';
import { Avatar, Button } from '../../../components/ui';

type StatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

const STATUS_LABEL: Record<ActionItemStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<ActionItemStatus, { bg: string; color: string; border: string }> = {
  TODO: {
    bg: 'var(--color-elevated)',
    color: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
  },
  IN_PROGRESS: {
    bg: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    border: 'var(--color-active-border)',
  },
  DONE: {
    bg: 'rgba(34,197,94,0.12)',
    color: '#16a34a',
    border: 'rgba(34,197,94,0.3)',
  },
  CANCELLED: {
    bg: 'var(--color-input)',
    color: 'var(--color-text-tertiary)',
    border: 'var(--color-border)',
  },
};

export const ChannelActionsPanel: React.FC = () => {
  const { setCreateActionModalOpen, jumpToMessage, activeId, activeType } = useUiStore();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [mineOnly, setMineOnly] = useState(false);
  const actionsQuery = useContextActionsQuery('ALL');
  const { updateActionItem, deleteActionItem } = useChatMutations();
  const { currentUser } = useWorkspace();

  const actions = useMemo(() => {
    let list = actionsQuery.data ?? [];
    if (filter !== 'ALL') {
      list = list.filter((a) => a.status === filter);
    }
    if (mineOnly) {
      list = list.filter((a) => a.assigneeId === currentUser.id);
    }
    return list;
  }, [actionsQuery.data, filter, mineOnly, currentUser.id]);

  const openCounts = useMemo(() => {
    const list = actionsQuery.data ?? [];
    return {
      open: list.filter((a) => a.status === 'TODO' || a.status === 'IN_PROGRESS').length,
      overdue: list.filter(
        (a) =>
          a.dueDate &&
          new Date(a.dueDate) < new Date() &&
          a.status !== 'DONE' &&
          a.status !== 'CANCELLED',
      ).length,
    };
  }, [actionsQuery.data]);

  const handleToggleDone = (item: ActionItem) => {
    const nextStatus: ActionItemStatus = item.status === 'DONE' ? 'TODO' : 'DONE';
    updateActionItem.mutate({ id: item.id, data: { status: nextStatus } });
  };

  const handleStatusChange = (id: string, status: ActionItemStatus) => {
    updateActionItem.mutate({ id, data: { status } });
  };

  const handleJump = (item: ActionItem) => {
    if (!item.messageId) return;
    jumpToMessage({
      messageId: item.messageId,
      channelId: item.channelId ?? (activeType === 'channel' ? activeId : undefined),
      conversationId:
        item.conversationId ?? (activeType === 'conversation' ? activeId : undefined),
    });
  };

  const filters: Array<{ id: StatusFilter; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'TODO', label: 'To do' },
    { id: 'IN_PROGRESS', label: 'In progress' },
    { id: 'DONE', label: 'Done' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--color-main)' }}>
      <div
        className="space-y-3 border-b p-4"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-header)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Action items
              </h3>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)' }}
              >
                {actions.length}
              </span>
            </div>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {openCounts.open} open
              {openCounts.overdue > 0 ? ` · ${openCounts.overdue} overdue` : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="xs"
            className="gap-1 shrink-0"
            onClick={() => setCreateActionModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: active ? 'var(--color-accent-muted)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  border: active ? '1px solid var(--color-active-border)' : '1px solid transparent',
                }}
              >
                {f.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            className="ml-auto rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
            style={{
              background: mineOnly ? 'var(--color-accent-muted)' : 'transparent',
              color: mineOnly ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              border: mineOnly ? '1px solid var(--color-active-border)' : '1px solid var(--color-border)',
            }}
          >
            Assigned to me
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {actionsQuery.isLoading ? (
          <div
            className="flex h-48 flex-col items-center justify-center gap-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs">Loading actions...</span>
          </div>
        ) : actions.length === 0 ? (
          <div
            className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <CheckCircle2 className="mb-2 h-8 w-8" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {mineOnly ? 'Nothing assigned to you' : 'No action items yet'}
            </p>
            <p className="mt-1 max-w-[240px] text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Add one here, or create from a message via the checkbox in the message menu.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="mt-3 gap-1"
              onClick={() => setCreateActionModalOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add action
            </Button>
          </div>
        ) : (
          actions.map((item) => {
            const isDone = item.status === 'DONE';
            const isCancelled = item.status === 'CANCELLED';
            const isOverdue =
              Boolean(item.dueDate) &&
              new Date(item.dueDate!) < new Date() &&
              !isDone &&
              !isCancelled;
            const statusStyle = STATUS_STYLE[item.status];

            return (
              <div
                key={item.id}
                className="group rounded-xl border p-3 transition-colors"
                style={{
                  background: 'var(--color-elevated)',
                  borderColor: isOverdue ? 'rgba(244,63,94,0.35)' : 'var(--color-border)',
                  opacity: isDone || isCancelled ? 0.75 : 1,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleToggleDone(item)}
                    className="mt-0.5 shrink-0 transition-colors"
                    style={{ color: isDone ? '#16a34a' : 'var(--color-text-tertiary)' }}
                    aria-label={isDone ? 'Mark as to do' : 'Mark as done'}
                  >
                    {isDone ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium leading-snug ${isDone ? 'line-through' : ''}`}
                      style={{
                        color: isDone ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                      }}
                    >
                      {item.title}
                    </p>

                    {item.description && !item.description.startsWith('From message:') && (
                      <p
                        className="mt-1 line-clamp-2 text-[11px]"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {item.description}
                      </p>
                    )}

                    <div
                      className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2"
                      style={{ borderColor: 'var(--color-border-subtle)' }}
                    >
                      {item.assigneeName ? (
                        <div
                          className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]"
                          style={{
                            borderColor: 'var(--color-border)',
                            background: 'var(--color-input)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          <Avatar
                            src={item.assigneeAvatar}
                            name={item.assigneeName}
                            size="xs"
                            className="h-3.5 w-3.5 text-[8px]"
                          />
                          <span>
                            {item.assigneeId === currentUser.id ? 'You' : item.assigneeName}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]"
                          style={{
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-tertiary)',
                          }}
                        >
                          <CircleDot className="h-3 w-3" />
                          Unassigned
                        </div>
                      )}

                      {item.dueDate && (
                        <div
                          className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]"
                          style={{
                            borderColor: isOverdue ? 'rgba(244,63,94,0.35)' : 'var(--color-border)',
                            background: isOverdue ? 'rgba(244,63,94,0.1)' : 'var(--color-input)',
                            color: isOverdue ? '#f43f5e' : 'var(--color-text-secondary)',
                          }}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(item.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {isOverdue ? ' · overdue' : ''}
                          </span>
                        </div>
                      )}

                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as ActionItemStatus)
                        }
                        className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold focus:outline-none"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderColor: statusStyle.border,
                        }}
                        aria-label="Status"
                      >
                        {(Object.keys(STATUS_LABEL) as ActionItemStatus[]).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>

                      <div className="ml-auto flex items-center gap-1">
                        {item.messageId && (
                          <button
                            type="button"
                            onClick={() => handleJump(item)}
                            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors hover-surface"
                            style={{ color: 'var(--color-text-secondary)' }}
                            title="Jump to message"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Context
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this action item?')) {
                              deleteActionItem.mutate(item.id);
                            }
                          }}
                          className="rounded-md p-1 opacity-0 transition-opacity hover-surface group-hover:opacity-100"
                          style={{ color: 'var(--color-danger, #f43f5e)' }}
                          aria-label="Delete action"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
