import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, User as UserIcon, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations } from '../../../hooks';
import { ActionItemStatus } from '@team-chat/shared';

export const CreateActionModal: React.FC = () => {
  const {
    createActionModalOpen,
    setCreateActionModalOpen,
    actionTargetMessage,
    setActionTargetMessage,
    activeId,
    activeType,
  } = useUiStore();

  const { users, currentUser } = useWorkspace();
  const { createActionItem } = useChatMutations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ActionItemStatus>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (createActionModalOpen) {
      if (actionTargetMessage) {
        setTitle(actionTargetMessage.content.slice(0, 80));
        setDescription(`From message: "${actionTargetMessage.content}"`);
      } else {
        setTitle('');
        setDescription('');
      }
      setStatus('TODO');
      setDueDate('');
      setAssigneeId(currentUser.id);
      setError(null);
    }
  }, [createActionModalOpen, actionTargetMessage, currentUser.id]);

  if (!createActionModalOpen) return null;

  const handleClose = () => {
    setCreateActionModalOpen(false);
    setActionTargetMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await createActionItem.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId || undefined,
        messageId: actionTargetMessage?.id,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create action item');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/40">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">
                {actionTargetMessage ? 'Turn Message into Action Item' : 'New In-Chat Action Item'}
              </h3>
              <p className="text-xs text-stone-400">
                Linked directly to conversation context & synced with tasks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Task Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Update API documentation for release"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/60 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Description / Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details, criteria, or context..."
              className="w-full px-3.5 py-2 rounded-xl bg-stone-950/60 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-stone-400" /> Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950/60 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950/60 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-stone-400" /> Initial Status
            </label>
            <div className="flex gap-2">
              {(['TODO', 'IN_PROGRESS', 'DONE'] as ActionItemStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                    status === st
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {st === 'TODO' ? '📋 To Do' : st === 'IN_PROGRESS' ? '⚡ In Progress' : '✅ Done'}
                </button>
              ))}
            </div>
          </div>

          {actionTargetMessage && (
            <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 text-xs text-stone-400 space-y-1">
              <span className="font-semibold text-stone-300">Originating Message:</span>
              <p className="line-clamp-2 italic">"{actionTargetMessage.content}"</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800/80">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createActionItem.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {createActionItem.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  Create Action Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
