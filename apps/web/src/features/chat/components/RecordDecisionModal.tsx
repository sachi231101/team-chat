import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { DecisionStatus } from '@team-chat/shared';
import { Modal, Button, Input } from '../../../components/ui';

const AREA_OPTIONS = [
  'Architecture',
  'Frontend',
  'Backend',
  'Database',
  'Security',
  'DevOps',
  'Product',
  'Design',
];

export const RecordDecisionModal: React.FC = () => {
  const {
    recordDecisionModalOpen,
    setRecordDecisionModalOpen,
    decisionTarget,
    setDecisionTarget,
    activeId,
    activeType,
  } = useUiStore();

  const { channels } = useWorkspace();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [status, setStatus] = useState<DecisionStatus>('APPROVED');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [channelId, setChannelId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordDecisionModalOpen) return;
    setTitle(decisionTarget?.title || '');
    setRationale(decisionTarget?.rationale || '');
    setStatus('APPROVED');
    setSelectedAreas([]);
    setChannelId(decisionTarget?.channelId || (activeType === 'channel' ? activeId : ''));
    setError(null);
  }, [recordDecisionModalOpen, decisionTarget, activeId, activeType]);

  const createMutation = useMutation({
    mutationFn: () =>
      chatService.createAiDecision({
        title: title.trim(),
        rationale: rationale.trim() || undefined,
        status,
        channelId: channelId || undefined,
        messageId: decisionTarget?.messageId,
        impactedAreas: selectedAreas,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['aiDecisions'] });
      handleClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
    },
  });

  const handleClose = () => {
    setRecordDecisionModalOpen(false);
    setDecisionTarget(null);
  };

  const handleToggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || createMutation.isPending) return;
    createMutation.mutate();
  };

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <Modal
      isOpen={recordDecisionModalOpen}
      onClose={handleClose}
      title="Record decision"
      description="Save an agreement from this chat so the team can find it later."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Use PostgreSQL for primary data store"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Rationale{' '}
            <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
              (optional)
            </span>
          </label>
          <textarea
            rows={3}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Why this was chosen, alternatives considered…"
            className="w-full resize-none rounded-xl p-3 text-sm leading-relaxed focus:outline-none"
            style={fieldStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Channel
            </label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={fieldStyle}
            >
              <option value="">Workspace-wide</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DecisionStatus)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={fieldStyle}
            >
              <option value="APPROVED">Approved</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="SUPERSEDED">Superseded</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Impacted areas
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AREA_OPTIONS.map((area) => {
              const active = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleToggleArea(area)}
                  className="rounded-lg border px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    background: active ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
                    borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2.5 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!title.trim() || createMutation.isPending}
            className="gap-1.5"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Record decision
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
