import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Plus,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { Avatar, Tooltip } from '../../../components/ui';
import { WorkExtractionResult, ExtractedTask, ExtractedDecision, ExtractedRisk, ExtractedApproval } from '@team-chat/shared';

export const ConversationToWorkModal: React.FC = () => {
  const {
    extractWorkModalOpen,
    setExtractWorkModalOpen,
    extractWorkTarget,
    activeId,
    activeType,
  } = useUiStore();

  const { users, currentUser } = useWorkspace();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'tasks' | 'decisions' | 'risks' | 'approvals'>('tasks');
  const [extractedData, setExtractedData] = useState<WorkExtractionResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Editable local state
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [decisions, setDecisions] = useState<ExtractedDecision[]>([]);
  const [risks, setRisks] = useState<ExtractedRisk[]>([]);
  const [approvals, setApprovals] = useState<ExtractedApproval[]>([]);

  const extractMutation = useMutation({
    mutationFn: () => {
      return chatService.extractWorkWithAi({
        channelId: extractWorkTarget?.channelId || (activeType === 'channel' ? activeId : undefined),
        conversationId: extractWorkTarget?.conversationId || (activeType === 'conversation' ? activeId : undefined),
        parentMessageId: extractWorkTarget?.parentMessageId,
        messageId: extractWorkTarget?.messageId,
        transcript: extractWorkTarget?.transcript,
      });
    },
    onSuccess: (data) => {
      setExtractedData(data);
      setTasks(data.tasks || []);
      setDecisions(data.decisions || []);
      setRisks(data.risks || []);
      setApprovals(data.approvals || []);
      setAppliedSuccess(false);
    },
  });

  useEffect(() => {
    if (extractWorkModalOpen) {
      extractMutation.mutate();
    } else {
      setExtractedData(null);
      setAppliedSuccess(false);
    }
  }, [extractWorkModalOpen]);

  if (!extractWorkModalOpen) return null;

  const handleApproveAll = async () => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      await chatService.applyWorkWithAi({
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
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
      void queryClient.invalidateQueries({ queryKey: ['actionItems'] });
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['messages'] });

      setTimeout(() => {
        setExtractWorkModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to apply extracted work:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleUpdateTask = (idx: number, field: keyof ExtractedTask, value: any) => {
    setTasks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleRemoveTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateDecision = (idx: number, field: keyof ExtractedDecision, value: any) => {
    setDecisions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleRemoveDecision = (idx: number) => {
    setDecisions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-150"
        style={{
          background: 'var(--color-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
              }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Conversation-to-Work</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  AI Extractor
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Detects action items, owners, deadlines, decisions, risks, and approvals automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => extractMutation.mutate()}
              disabled={extractMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${extractMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Re-analyze</span>
            </button>
            <button
              type="button"
              onClick={() => setExtractWorkModalOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Summary Banner */}
        {extractedData?.summary && (
          <div
            className="px-6 py-3 border-b text-xs flex items-center gap-2.5"
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              borderColor: 'rgba(139, 92, 246, 0.2)',
              color: '#c4b5fd',
            }}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-violet-400" />
            <span className="leading-relaxed">
              <strong>Summary:</strong> {extractedData.summary}
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          className="flex items-center gap-2 px-6 pt-3 border-b shrink-0 text-xs font-semibold"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {[
            { id: 'tasks', label: 'Action Items & Tasks', count: tasks.length, icon: CheckSquare, color: 'text-emerald-400' },
            { id: 'decisions', label: 'Decisions Agreed', count: decisions.length, icon: Award, color: 'text-amber-400' },
            { id: 'risks', label: 'Risks & Blockers', count: risks.length, icon: AlertTriangle, color: 'text-rose-400' },
            { id: 'approvals', label: 'Approvals Required', count: approvals.length, icon: FileCheck, color: 'text-sky-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-all ${
                  active
                    ? 'border-violet-500 text-white font-bold'
                    : 'border-transparent text-stone-400 hover:text-stone-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-violet-500/20 text-violet-300' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[280px] space-y-4">
          {extractMutation.isPending ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm font-semibold text-stone-200">Analyzing conversation with AI...</p>
              <p className="text-xs text-stone-500 max-w-sm text-center">
                Extracting action items, assignees, deadlines, decisions, risks, and pending approvals
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-xl">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-400" />
                      <p className="text-sm font-medium text-stone-300">No pending action items detected</p>
                      <p className="text-xs mt-1 text-stone-500">
                        Discuss deliverables, assign owners, or set deadlines in chat to detect them automatically.
                      </p>
                    </div>
                  ) : (
                    tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border bg-stone-950/60 border-stone-800/80 hover:border-emerald-500/40 shadow-sm transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleUpdateTask(idx, 'title', e.target.value)}
                            className="flex-1 bg-transparent text-sm font-semibold text-stone-100 focus:outline-none focus:border-b border-violet-500"
                            placeholder="Task title..."
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(idx)}
                            className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                            title="Remove task"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {task.description && (
                          <textarea
                            value={task.description}
                            onChange={(e) => handleUpdateTask(idx, 'description', e.target.value)}
                            rows={2}
                            className="w-full text-xs bg-stone-900/80 rounded-lg p-2 text-stone-300 border border-stone-800 focus:outline-none"
                            placeholder="Description..."
                          />
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-stone-800/60">
                          {/* Assignee selector */}
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-violet-400" />
                            <select
                              value={task.assigneeId || ''}
                              onChange={(e) => handleUpdateTask(idx, 'assigneeId', e.target.value || undefined)}
                              className="bg-stone-900 text-stone-200 border border-stone-800 rounded-md px-2 py-1 text-xs focus:outline-none"
                            >
                              <option value="">Unassigned</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} {u.id.startsWith('usr-agent-') ? '(AI Agent)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Due Date */}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            <input
                              type="date"
                              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                              onChange={(e) => handleUpdateTask(idx, 'dueDate', e.target.value || undefined)}
                              className="bg-stone-900 text-stone-200 border border-stone-800 rounded-md px-2 py-1 text-xs focus:outline-none"
                            />
                          </div>

                          {task.confidence && (
                            <span className="ml-auto text-[10px] text-stone-500">
                              {(task.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Decisions */}
              {activeTab === 'decisions' && (
                <div className="space-y-3">
                  {decisions.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-xl">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-400" />
                      <p className="text-sm font-medium text-stone-300">No explicit decisions detected</p>
                      <p className="text-xs mt-1 text-stone-500">
                        When the team agrees on architectures, designs, or policies, they will be captured here.
                      </p>
                    </div>
                  ) : (
                    decisions.map((dec, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border bg-stone-950/60 border-stone-800/80 hover:border-amber-500/40 shadow-sm transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <input
                            type="text"
                            value={dec.title}
                            onChange={(e) => handleUpdateDecision(idx, 'title', e.target.value)}
                            className="flex-1 bg-transparent text-sm font-semibold text-amber-300 focus:outline-none focus:border-b border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDecision(idx)}
                            className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-xs text-stone-300 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800/80">
                          <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                            Rationale
                          </label>
                          <textarea
                            value={dec.rationale || ''}
                            onChange={(e) => handleUpdateDecision(idx, 'rationale', e.target.value)}
                            rows={2}
                            className="w-full bg-transparent text-xs text-stone-200 focus:outline-none resize-none"
                            placeholder="Why this was agreed..."
                          />
                        </div>

                        {dec.impactedAreas && dec.impactedAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {dec.impactedAreas.map((area, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Risks & Blockers */}
              {activeTab === 'risks' && (
                <div className="space-y-3">
                  {risks.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-xl">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-rose-400" />
                      <p className="text-sm font-medium text-stone-300">No critical risks or blockers identified</p>
                    </div>
                  ) : (
                    risks.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border bg-stone-950/60 border-stone-800/80 hover:border-rose-500/40 shadow-sm transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              r.severity === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : r.severity === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {r.severity} Severity
                          </span>
                          {r.owner && (
                            <span className="text-[11px] text-stone-400">Owner: @{r.owner}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-stone-100">{r.title}</p>
                        {r.mitigation && (
                          <p className="text-xs text-stone-300 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                            <strong>Recommended Mitigation:</strong> {r.mitigation}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: Approvals */}
              {activeTab === 'approvals' && (
                <div className="space-y-3">
                  {approvals.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-xl">
                      <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50 text-sky-400" />
                      <p className="text-sm font-medium text-stone-300">No pending approval requests</p>
                    </div>
                  ) : (
                    approvals.map((app, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border bg-stone-950/60 border-stone-800/80 hover:border-sky-500/40 shadow-sm transition-all flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-stone-100">{app.item}</p>
                          <div className="flex items-center gap-3 text-xs text-stone-400">
                            {app.requester && <span>Requested by: @{app.requester}</span>}
                            {app.approver && <span>Approver: @{app.approver}</span>}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                          {app.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t bg-stone-950/50 shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="text-xs text-stone-400">
            <span>
              {tasks.length} action {tasks.length === 1 ? 'item' : 'items'} • {decisions.length}{' '}
              {decisions.length === 1 ? 'decision' : 'decisions'} to commit
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExtractWorkModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>

            {appliedSuccess ? (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <Check className="w-4 h-4" />
                <span>Work Committed to Workspace!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleApproveAll}
                disabled={isApplying || extractMutation.isPending || (tasks.length === 0 && decisions.length === 0)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg shadow-violet-600/30 transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                }}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing Work Items...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Approve & Create Work Items</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
