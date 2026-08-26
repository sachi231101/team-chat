import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Award, Check, Loader2, Tag } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { DecisionStatus } from '@team-chat/shared';

const AREA_OPTIONS = ['Architecture', 'Frontend', 'Backend', 'Database', 'Security', 'DevOps', 'Product', 'Design'];

export const RecordDecisionModal: React.FC = () => {
  const {
    recordDecisionModalOpen,
    setRecordDecisionModalOpen,
    decisionTarget,
    activeId,
    activeType,
  } = useUiStore();

  const { channels, currentUser } = useWorkspace();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [status, setStatus] = useState<DecisionStatus>('APPROVED');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    if (recordDecisionModalOpen) {
      setTitle(decisionTarget?.title || '');
      setRationale(decisionTarget?.rationale || '');
      setStatus('APPROVED');
      setSelectedAreas(['Architecture']);
      setChannelId(decisionTarget?.channelId || (activeType === 'channel' ? activeId : ''));
    }
  }, [recordDecisionModalOpen, decisionTarget, activeId, activeType]);

  const createMutation = useMutation({
    mutationFn: () =>
      chatService.createAiDecision({
        title,
        rationale,
        status,
        channelId: channelId || undefined,
        messageId: decisionTarget?.messageId,
        impactedAreas: selectedAreas,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['aiDecisions'] });
      setRecordDecisionModalOpen(false);
    },
  });

  if (!recordDecisionModalOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-150"
        style={{
          background: 'var(--color-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              }}
            >
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Architecture Decision</h2>
              <p className="text-xs text-stone-400">
                Preserve important team agreements as permanent searchable records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRecordDecisionModalOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Decision Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Adopt PostgreSQL over DynamoDB for ACID compliance..."
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-stone-900 text-stone-100 border border-stone-800 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Rationale & Trade-offs
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why was this chosen? What alternatives were considered?"
              className="w-full rounded-xl p-3 text-xs bg-stone-900 text-stone-100 border border-stone-800 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Channel Context
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs bg-stone-900 text-stone-200 border border-stone-800 focus:outline-none"
              >
                <option value="">Workspace-wide</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl px-3 py-2 text-xs bg-stone-900 text-stone-200 border border-stone-800 focus:outline-none"
              >
                <option value="APPROVED">Approved / Active</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SUPERSEDED">Superseded</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300 block">
              Impacted Areas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AREA_OPTIONS.map((area) => {
                const active = selectedAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleToggleArea(area)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setRecordDecisionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg shadow-amber-600/30 transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Record Decision</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
