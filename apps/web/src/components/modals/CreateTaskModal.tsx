import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, User as UserIcon, Tag, Check, AlertCircle } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Modal, Button, Input, Avatar } from '../ui';

export const CreateTaskModal: React.FC = () => {
  const {
    taskModalOpen,
    setTaskModalOpen,
    actionTargetMessage,
    users,
    currentUser,
  } = useChatDataStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (actionTargetMessage) {
      const cleanContent = actionTargetMessage.content.replace(/\n+/g, ' ');
      setTitle(cleanContent.slice(0, 70));
      setDescription(`Source from @${actionTargetMessage.senderName}:\n\n"${actionTargetMessage.content}"`);
      setAssigneeId(currentUser.id);
      setIsSuccess(false);
    }
  }, [actionTargetMessage, currentUser.id]);

  const handleCreate = () => {
    if (!title.trim()) return;

    // Dispatch workplace task event (stored for workplace platform integration)
    const taskPayload = {
      id: `tsk-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      creatorId: currentUser.id,
      priority,
      dueDate: dueDate || undefined,
      sourceMessageId: actionTargetMessage?.id,
      workplaceId: currentUser.workplaceId,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('team_chat_tasks') || '[]');
      localStorage.setItem('team_chat_tasks', JSON.stringify([taskPayload, ...existing]));
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTaskModalOpen(false);
    }, 1200);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setTaskModalOpen(false);
  };

  return (
    <Modal
      isOpen={taskModalOpen}
      onClose={handleClose}
      title="Create Task from Message"
      description="Convert this discussion item into an actionable workplace task."
    >
      <div className="mt-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Title</label>
          <Input
            placeholder="e.g. Verify deployment checklist..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Context</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Grid: Assignee & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
              <span>Assignee</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.title || 'Member'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              <span>Priority</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none capitalize"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-sky-400" />
            <span>Due Date (Optional)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
            <span>Will be linked to source message</span>
          </span>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!title.trim()}
              onClick={handleCreate}
              className="gap-1.5"
            >
              {isSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Task Created!</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  <span>Create Task</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
