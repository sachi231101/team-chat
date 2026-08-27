import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, User as UserIcon, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations } from '../../../hooks';
import { ActionItemStatus } from '@team-chat/shared';
import { Modal, Button, Input } from '../../../components/ui';

/** Strip markdown noise so action titles stay readable. */
function titleFromMessage(content: string): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/[-*_]{3,}/g, ' ')
    .replace(/[#>*_~[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 'Follow up';
  return plain.length > 80 ? `${plain.slice(0, 77)}…` : plain;
}

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
    if (!createActionModalOpen) return;
    if (actionTargetMessage) {
      setTitle(titleFromMessage(actionTargetMessage.content));
      setDescription('');
    } else {
      setTitle('');
      setDescription('');
    }
    setStatus('TODO');
    setDueDate('');
    setAssigneeId(currentUser.id);
    setError(null);
  }, [createActionModalOpen, actionTargetMessage, currentUser.id]);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create action item');
    }
  };

  const people = users.filter((u) => !u.id.startsWith('usr-agent-'));
  const agents = users.filter((u) => u.id.startsWith('usr-agent-'));

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <Modal
      isOpen={createActionModalOpen}
      onClose={handleClose}
      title={actionTargetMessage ? 'Create action from message' : 'New action item'}
      description="Track follow-ups tied to this chat. Linked to the conversation context."
      maxWidth="lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
        {error && (
          <div
            className="flex items-center gap-2 rounded-lg border p-3 text-xs"
            style={{
              background: 'var(--color-danger-muted, rgba(244,63,94,0.1))',
              borderColor: 'rgba(244,63,94,0.3)',
              color: 'var(--color-danger, #f43f5e)',
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Title <span style={{ color: 'var(--color-accent)' }}>*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Update API docs for release"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Notes <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Acceptance criteria, links, or extra context…"
            className="w-full resize-none rounded-xl px-3.5 py-2 text-sm focus:outline-none"
            style={fieldStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="mb-1.5 flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <UserIcon className="h-3.5 w-3.5" /> Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={fieldStyle}
            >
              <option value="">Unassigned</option>
              <optgroup label="People">
                {people.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.id === currentUser.id ? ' (You)' : ''}
                  </option>
                ))}
              </optgroup>
              {agents.length > 0 && (
                <optgroup label="AI apps">
                  {agents.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              People for teammates · AI apps can pick up agent-runnable tasks
            </p>
          </div>

          <div>
            <label
              className="mb-1.5 flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Calendar className="h-3.5 w-3.5" /> Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={fieldStyle}
            />
          </div>
        </div>

        <div>
          <label
            className="mb-1.5 flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Tag className="h-3.5 w-3.5" /> Status
          </label>
          <div className="flex gap-2">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as ActionItemStatus[]).map((st) => {
              const active = status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: active ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
                    borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {st === 'TODO' ? 'To do' : st === 'IN_PROGRESS' ? 'In progress' : 'Done'}
                </button>
              );
            })}
          </div>
        </div>

        {actionTargetMessage && (
          <div
            className="space-y-1 rounded-xl border p-3 text-xs"
            style={{
              background: 'var(--color-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Linked message
            </span>
            <p className="line-clamp-2 italic">“{titleFromMessage(actionTargetMessage.content)}”</p>
          </div>
        )}

        <div
          className="flex items-center justify-end gap-2.5 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={createActionItem.isPending} className="gap-1.5">
            {createActionItem.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5" />
                Create
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
