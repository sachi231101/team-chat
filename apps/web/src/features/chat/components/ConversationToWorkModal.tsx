import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Sparkles,
  Check,
  CheckSquare,
  Award,
  AlertTriangle,
  FileCheck,
  User,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { Button } from '../../../components/ui';
import { queryKeys } from '../../../lib/queryKeys';
import {
  WorkExtractionResult,
  ExtractedTask,
  ExtractedDecision,
  ExtractedRisk,
  ExtractedApproval,
} from '@team-chat/shared';

type TabId = 'tasks' | 'decisions' | 'risks' | 'approvals';

function friendlyAiError(raw?: string): string {
  if (!raw) return 'AI could not analyze this chat right now.';
  const lower = raw.toLowerCase();
  if (lower.includes('404') || lower.includes('not found') || lower.includes('model')) {
    return 'AI model is unavailable. Check AI_MODEL / AI_API_KEY in the API env, then try again.';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('auth') || lower.includes('api key')) {
    return 'AI authentication failed. Check AI_API_KEY in the API env.';
  }
  if (lower.includes('timeout') || lower.includes('network') || lower.includes('fetch')) {
    return 'Network error talking to the AI service. Try again in a moment.';
  }
  return raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;
}

export const ConversationToWorkModal: React.FC = () => {
  const {
    extractWorkModalOpen,
    setExtractWorkModalOpen,
    extractWorkTarget,
    setExtractWorkTarget,
    activeId,
    activeType,
    setChatHeaderTab,
  } = useUiStore();

  const { users } = useWorkspace();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [extractedData, setExtractedData] = useState<WorkExtractionResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [decisions, setDecisions] = useState<ExtractedDecision[]>([]);
  const [risks, setRisks] = useState<ExtractedRisk[]>([]);
  const [approvals, setApprovals] = useState<ExtractedApproval[]>([]);

  const people = users.filter((u) => !u.id.startsWith('usr-agent-'));
  const agents = users.filter((u) => u.id.startsWith('usr-agent-'));

  const scopeLabel = extractWorkTarget?.messageId
    ? 'This message'
    : activeType === 'conversation'
      ? 'This direct message'
      : 'This channel';

  const resetLocal = useCallback(() => {
    setExtractedData(null);
    setTasks([]);
    setDecisions([]);
    setRisks([]);
    setApprovals([]);
    setAppliedSuccess(false);
    setApplyError(null);
    setActiveTab('tasks');
  }, []);

  const extractMutation = useMutation({
    mutationFn: () =>
      chatService.extractWorkWithAi({
        channelId:
          extractWorkTarget?.channelId ||
          (activeType === 'channel' ? activeId : undefined),
        conversationId:
          extractWorkTarget?.conversationId ||
          (activeType === 'conversation' ? activeId : undefined),
        parentMessageId: extractWorkTarget?.parentMessageId,
        messageId: extractWorkTarget?.messageId,
        transcript: extractWorkTarget?.transcript,
      }),
    onSuccess: (data) => {
      setExtractedData(data);
      setTasks(data.tasks || []);
      setDecisions(data.decisions || []);
      setRisks(data.risks || []);
      setApprovals(data.approvals || []);
      setAppliedSuccess(false);
      setApplyError(null);
      if ((data.tasks?.length ?? 0) === 0 && (data.decisions?.length ?? 0) > 0) {
        setActiveTab('decisions');
      } else {
        setActiveTab('tasks');
      }
    },
  });

  useEffect(() => {
    if (extractWorkModalOpen) {
      resetLocal();
      extractMutation.mutate();
    } else {
      resetLocal();
      setExtractWorkTarget(null);
    }
    // intentionally only when open toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractWorkModalOpen]);

  if (!extractWorkModalOpen) return null;

  const extractError =
    extractMutation.isError
      ? friendlyAiError(
          extractMutation.error instanceof Error
            ? extractMutation.error.message
            : String(extractMutation.error),
        )
      : extractedData?.error
        ? friendlyAiError(extractedData.error)
        : null;

  const hasCommitable = tasks.length > 0 || decisions.length > 0;

  const handleClose = () => {
    setExtractWorkModalOpen(false);
  };

  const handleApproveAll = async () => {
    if (isApplying || !hasCommitable) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      const channelId =
        extractWorkTarget?.channelId ||
        (activeType === 'channel' ? activeId : undefined);
      const conversationId =
        extractWorkTarget?.conversationId ||
        (activeType === 'conversation' ? activeId : undefined);

      await chatService.applyWorkWithAi({
        channelId,
        conversationId,
        messageId: extractWorkTarget?.messageId,
        tasks: tasks.map((t) => ({
          title: t.title,
          description: t.description,
          assigneeId: t.assigneeId,
          dueDate: t.dueDate,
          status: t.status,
        })),
        decisions: decisions.map((d) => ({
          title: d.title,
          rationale: d.rationale,
          impactedAreas: d.impactedAreas,
        })),
      });

      setAppliedSuccess(true);
      void queryClient.invalidateQueries({ queryKey: ['actions'] });
      void queryClient.invalidateQueries({ queryKey: ['aiDecisions'] });
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
      if (activeId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.actions(activeType, activeId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.decisions(activeType, activeId),
        });
      }

      if (tasks.length > 0) setChatHeaderTab('actions');
      else if (decisions.length > 0) setChatHeaderTab('decisions');

      setTimeout(() => handleClose(), 1000);
    } catch (err) {
      setApplyError(
        err instanceof Error ? err.message : 'Failed to save work items.',
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleUpdateTask = (idx: number, field: keyof ExtractedTask, value: string | undefined) => {
    setTasks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleUpdateDecision = (
    idx: number,
    field: keyof ExtractedDecision,
    value: string | string[] | undefined,
  ) => {
    setDecisions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as ExtractedDecision;
      return next;
    });
  };

  const tabs: Array<{ id: TabId; label: string; count: number; icon: typeof CheckSquare }> = [
    { id: 'tasks', label: 'Tasks', count: tasks.length, icon: CheckSquare },
    { id: 'decisions', label: 'Decisions', count: decisions.length, icon: Award },
    { id: 'risks', label: 'Risks', count: risks.length, icon: AlertTriangle },
    { id: 'approvals', label: 'Approvals', count: approvals.length, icon: FileCheck },
  ];

  const emptyPanel = (icon: React.ReactNode, title: string, body: string) => (
    <div
      className="rounded-xl border border-dashed px-4 py-12 text-center"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="mx-auto mb-2 flex justify-center opacity-60">{icon}</div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        {body}
      </p>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-elevated)',
    border: '1px solid var(--color-border)',
  };

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150"
        style={{
          background: 'var(--color-modal)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Extract work
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: 'var(--color-accent-muted)',
                  color: 'var(--color-accent)',
                }}
              >
                {scopeLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              AI suggests tasks and decisions — review, then save into this chat.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="gap-1"
              disabled={extractMutation.isPending}
              onClick={() => extractMutation.mutate()}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${extractMutation.isPending ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 transition-colors hover-surface"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {extractedData?.summary && !extractError && (
          <div
            className="flex items-start gap-2 border-b px-5 py-2.5 text-xs"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-accent-muted)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
            <span>
              <strong style={{ color: 'var(--color-text-primary)' }}>Summary:</strong> {extractedData.summary}
            </span>
          </div>
        )}

        <div
          className="flex items-center gap-1 overflow-x-auto border-b px-4 pt-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 text-xs font-semibold transition-colors"
                style={{
                  borderBottomColor: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{
                    background: active ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-h-[260px] flex-1 space-y-3 overflow-y-auto p-5">
          {extractMutation.isPending ? (
            <div
              className="flex h-48 flex-col items-center justify-center gap-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Analyzing conversation…
              </p>
              <p className="max-w-sm text-center text-xs">
                Looking for tasks, owners, deadlines, and decisions
              </p>
            </div>
          ) : extractError ? (
            <div
              className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 text-center"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <AlertTriangle className="h-8 w-8" style={{ color: 'var(--color-danger, #f43f5e)' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Extraction failed
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {extractError}
                </p>
                <p className="mx-auto mt-2 max-w-md text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  You can still add actions or record decisions manually from the Actions / Decisions tabs.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="xs"
                className="gap-1"
                onClick={() => extractMutation.mutate()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </Button>
            </div>
          ) : (
            <>
              {activeTab === 'tasks' &&
                (tasks.length === 0
                  ? emptyPanel(
                      <CheckSquare className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />,
                      'No tasks detected',
                      'Talk about deliverables, owners, or deadlines in chat, then retry.',
                    )
                  : tasks.map((task, idx) => (
                      <div key={idx} className="space-y-2.5 rounded-xl p-3.5" style={cardStyle}>
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleUpdateTask(idx, 'title', e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none"
                            style={{ color: 'var(--color-text-primary)' }}
                            placeholder="Task title"
                          />
                          <button
                            type="button"
                            onClick={() => setTasks((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded p-1 hover-surface"
                            style={{ color: 'var(--color-text-tertiary)' }}
                            aria-label="Remove task"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          value={task.description || ''}
                          onChange={(e) => handleUpdateTask(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-lg p-2 text-xs focus:outline-none"
                          style={fieldStyle}
                          placeholder="Notes (optional)"
                        />
                        <div
                          className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs"
                          style={{ borderColor: 'var(--color-border-subtle)' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                            <select
                              value={task.assigneeId || ''}
                              onChange={(e) =>
                                handleUpdateTask(idx, 'assigneeId', e.target.value || undefined)
                              }
                              className="rounded-md px-2 py-1 text-xs focus:outline-none"
                              style={fieldStyle}
                            >
                              <option value="">Unassigned</option>
                              <optgroup label="People">
                                {people.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
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
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                            <input
                              type="date"
                              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                              onChange={(e) =>
                                handleUpdateTask(idx, 'dueDate', e.target.value || undefined)
                              }
                              className="rounded-md px-2 py-1 text-xs focus:outline-none"
                              style={fieldStyle}
                            />
                          </div>
                          {typeof task.confidence === 'number' && (
                            <span className="ml-auto text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                              {Math.round(task.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    )))}

              {activeTab === 'decisions' &&
                (decisions.length === 0
                  ? emptyPanel(
                      <Award className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />,
                      'No decisions detected',
                      'Agreements and architecture choices in the thread will show up here.',
                    )
                  : decisions.map((dec, idx) => (
                      <div key={idx} className="space-y-2 rounded-xl p-3.5" style={cardStyle}>
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={dec.title}
                            onChange={(e) => handleUpdateDecision(idx, 'title', e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none"
                            style={{ color: 'var(--color-text-primary)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setDecisions((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded p-1 hover-surface"
                            style={{ color: 'var(--color-text-tertiary)' }}
                            aria-label="Remove decision"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          value={dec.rationale || ''}
                          onChange={(e) => handleUpdateDecision(idx, 'rationale', e.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-lg p-2 text-xs focus:outline-none"
                          style={fieldStyle}
                          placeholder="Rationale"
                        />
                        {dec.impactedAreas && dec.impactedAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dec.impactedAreas.map((area) => (
                              <span
                                key={area}
                                className="rounded border px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  background: 'var(--color-accent-muted)',
                                  borderColor: 'var(--color-active-border)',
                                  color: 'var(--color-accent)',
                                }}
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )))}

              {activeTab === 'risks' &&
                (risks.length === 0
                  ? emptyPanel(
                      <AlertTriangle className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />,
                      'No risks flagged',
                      'Risks are informational — they are not saved when you approve.',
                    )
                  : risks.map((r, idx) => (
                      <div key={idx} className="space-y-2 rounded-xl p-3.5" style={cardStyle}>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{
                              background:
                                r.severity === 'HIGH'
                                  ? 'rgba(244,63,94,0.12)'
                                  : r.severity === 'MEDIUM'
                                    ? 'rgba(245,158,11,0.12)'
                                    : 'var(--color-accent-muted)',
                              color:
                                r.severity === 'HIGH'
                                  ? '#f43f5e'
                                  : r.severity === 'MEDIUM'
                                    ? '#f59e0b'
                                    : 'var(--color-accent)',
                            }}
                          >
                            {r.severity}
                          </span>
                          {r.owner && (
                            <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                              Owner: {r.owner}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {r.title}
                        </p>
                        {r.mitigation && (
                          <p className="rounded-lg p-2 text-xs" style={fieldStyle}>
                            <strong>Mitigation:</strong> {r.mitigation}
                          </p>
                        )}
                      </div>
                    )))}

              {activeTab === 'approvals' &&
                (approvals.length === 0
                  ? emptyPanel(
                      <FileCheck className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />,
                      'No approvals detected',
                      'Approvals are informational — they are not saved when you approve.',
                    )
                  : approvals.map((app, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl p-3.5"
                        style={cardStyle}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {app.item}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {[app.requester && `From ${app.requester}`, app.approver && `Approver ${app.approver}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                          style={{
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {app.status}
                        </span>
                      </div>
                    )))}
            </>
          )}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-header)' }}
        >
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {extractError
              ? 'Fix AI config or use Actions / Decisions manually'
              : `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${decisions.length} decision${decisions.length === 1 ? '' : 's'} will be saved${
                  risks.length + approvals.length > 0
                    ? ` · ${risks.length + approvals.length} notes stay in this preview only`
                    : ''
                }`}
            {applyError && (
              <p className="mt-1" style={{ color: 'var(--color-danger, #f43f5e)' }}>
                {applyError}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            {appliedSuccess ? (
              <div
                className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  borderColor: 'rgba(34,197,94,0.3)',
                  color: '#16a34a',
                }}
              >
                <Check className="h-4 w-4" />
                Saved
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="gap-1.5"
                disabled={
                  isApplying ||
                  extractMutation.isPending ||
                  Boolean(extractError) ||
                  !hasCommitable
                }
                onClick={() => void handleApproveAll()}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save {hasCommitable ? `${tasks.length + decisions.length} item${tasks.length + decisions.length === 1 ? '' : 's'}` : 'items'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
