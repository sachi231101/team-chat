import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  User as UserIcon,
  MessageSquare,
  Loader2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useContextActionsQuery, useChatMutations, useWorkspace } from '../../../hooks';
import { ActionItem, ActionItemStatus } from '@team-chat/shared';
import { Avatar } from '../../../components/ui';

export const ChannelActionsPanel: React.FC = () => {
  const { setCreateActionModalOpen, jumpToMessage, activeId, activeType } = useUiStore();
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const actionsQuery = useContextActionsQuery(filter);
  const { updateActionItem, deleteActionItem } = useChatMutations();
  const { currentUser } = useWorkspace();

  const actions = actionsQuery.data ?? [];

  const handleToggleStatus = (item: ActionItem) => {
    const nextStatus: ActionItemStatus = item.status === 'DONE' ? 'TODO' : 'DONE';
    updateActionItem.mutate({
      id: item.id,
      data: { status: nextStatus },
    });
  };

  const handleStatusChange = (id: string, status: ActionItemStatus) => {
    updateActionItem.mutate({
      id,
      data: { status },
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-900/50">
      {/* Header Controls */}
      <div className="p-4 border-b border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-stone-200">Action Items</h3>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-800 text-stone-400">
              {actions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCreateActionModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Action
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-stone-950/60 border border-stone-800/80">
          {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`flex-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-all ${
                filter === st
                  ? 'bg-stone-800 text-emerald-400 shadow-sm'
                  : 'text-stone-400 hover:text-stone-300'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'TODO' ? 'To Do' : st === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {actionsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-stone-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs">Loading action items...</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-stone-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-stone-600 mb-2" />
            <p className="text-xs font-medium text-stone-300">No action items found</p>
            <p className="text-[11px] text-stone-500 mt-1 max-w-[200px]">
              Hover any message and click the checkbox icon to create a task with an assignee and due date.
            </p>
          </div>
        ) : (
          actions.map((item) => {
            const isDone = item.status === 'DONE';
            const isOverdue =
              item.dueDate &&
              new Date(item.dueDate) < new Date() &&
              item.status !== 'DONE';

            return (
              <div
                key={item.id}
                className={`group p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-stone-950/20 border-stone-800/40 opacity-75'
                    : 'bg-stone-950/60 border-stone-800/80 hover:border-emerald-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className="mt-0.5 text-stone-400 hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug ${
                        isDone ? 'line-through text-stone-500' : 'text-stone-200'
                      }`}
                    >
                      {item.title}
                    </p>

                    {item.description && (
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-stone-800/50 text-[10px]">
                      {item.assigneeName && (
                        <div className="flex items-center gap-1 text-stone-300 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                          <Avatar
                            src={item.assigneeAvatar}
                            name={item.assigneeName}
                            size="xs"
                            className="w-3.5 h-3.5 text-[8px]"
                          />
                          <span>{item.assigneeName}</span>
                        </div>
                      )}

                      {item.dueDate && (
                        <div
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                            isOverdue
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                              : 'bg-stone-900 border-stone-800 text-stone-400'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(item.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}

                      {/* Status Selector Dropdown */}
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ActionItemStatus)}
                        className="bg-stone-900 border border-stone-800 text-stone-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>

                      {/* Jump to message link */}
                      {item.messageId && (
                        <button
                          type="button"
                          onClick={() =>
                            jumpToMessage({
                              messageId: item.messageId!,
                              channelId: activeType === 'channel' ? activeId : undefined,
                              conversationId: activeType === 'conversation' ? activeId : undefined,
                            })
                          }
                          className="flex items-center gap-1 text-stone-400 hover:text-emerald-400 transition-colors ml-auto"
                          title="Jump to message context"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>View Context</span>
                        </button>
                      )}
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
