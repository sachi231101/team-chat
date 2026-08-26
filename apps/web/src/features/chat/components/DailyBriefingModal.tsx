import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Sun,
  Sparkles,
  CheckSquare,
  Award,
  AlertTriangle,
  FileCheck,
  Calendar,
  Clock,
  Check,
  Copy,
  RefreshCw,
  ArrowUpRight,
  Loader2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations } from '../../../hooks';
import { chatService } from '../../../services';
import { DailyBriefingData, ActionItemStatus } from '@team-chat/shared';

export const DailyBriefingModal: React.FC = () => {
  const { dailyBriefingOpen, setDailyBriefingOpen, jumpToMessage, setActiveChannel } = useUiStore();
  const { currentUser } = useWorkspace();
  const { updateActionItem } = useChatMutations();
  const queryClient = useQueryClient();

  const [timeframe, setTimeframe] = useState<'today' | '24h' | '7d'>('24h');
  const [copied, setCopied] = useState(false);

  const briefingQuery = useQuery({
    queryKey: ['dailyBriefing', timeframe],
    queryFn: () => chatService.getDailyBriefing(timeframe),
    enabled: dailyBriefingOpen,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => chatService.generateDailyBriefing(timeframe),
    onSuccess: (data) => {
      queryClient.setQueryData(['dailyBriefing', timeframe], data);
    },
  });

  if (!dailyBriefingOpen) return null;

  const data: DailyBriefingData | undefined = briefingQuery.data;

  const handleCopyDigest = () => {
    if (!data) return;
    const digestText = `🌅 Daily Briefing for ${data.userName} (${data.timeframe})\n\n${data.summary}\n\nTasks (${data.myTasks.length}):\n${data.myTasks.map((t) => `- [${t.status}] ${t.title}`).join('\n')}\n\nDecisions (${data.keyDecisions.length}):\n${data.keyDecisions.map((d) => `- ${d.title} (#${d.channelName})`).join('\n')}`;
    navigator.clipboard.writeText(digestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleTaskStatus = (taskId: string, currentStatus: ActionItemStatus) => {
    const nextStatus: ActionItemStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    updateActionItem.mutate(
      { id: taskId, data: { status: nextStatus } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['dailyBriefing'] });
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-150"
        style={{
          background: 'var(--color-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)',
              }}
            >
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Personal Daily Briefing</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentUser.name}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Tailored intelligence: decisions, blockers, assignments, approvals, and executive recap
              </p>
            </div>
          </div>

          {/* Timeframe & Action buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-900/90 rounded-lg p-0.5 border border-stone-800 text-xs">
              {(['today', '24h', '7d'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {tf === 'today' ? 'Today' : tf === '24h' ? '24 Hours' : '7 Days'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending || briefingQuery.isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors disabled:opacity-40"
              title="Regenerate briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDigest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
              title="Copy briefing digest"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDailyBriefingOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {briefingQuery.isLoading || regenerateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm font-semibold text-stone-200">Synthesizing personalized daily briefing...</p>
              <p className="text-xs text-stone-500">
                Scanning your assigned tasks, team decisions, active blockers, and unread conversations
              </p>
            </div>
          ) : data ? (
            <>
              {/* Executive Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-stone-900 border border-amber-500/30 shadow-lg space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Executive AI Digest</span>
                  <span className="ml-auto text-[10px] text-stone-400 font-normal">
                    Generated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-stone-100 font-medium whitespace-pre-wrap">
                  {data.summary}
                </p>
              </div>

              {/* Grid Section: Tasks & Decisions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. My Tasks & Deadlines */}
                <div className="p-4 rounded-2xl border bg-stone-950/50 border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-stone-200">My Tasks & Deadlines</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
                      {data.myTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.myTasks.length === 0 ? (
                      <p className="text-xs text-stone-500 py-4 text-center italic">
                        No pending tasks assigned to you.
                      </p>
                    ) : (
                      data.myTasks.map((t) => {
                        const isDone = t.status === 'DONE';
                        return (
                          <div
                            key={t.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-all ${
                              isDone
                                ? 'bg-stone-900/40 border-stone-800/40 opacity-70'
                                : t.isOverdue
                                ? 'bg-rose-950/30 border-rose-500/40'
                                : 'bg-stone-900/80 border-stone-800 hover:border-emerald-500/40'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(t.id, t.status)}
                              className="mt-0.5 text-stone-400 hover:text-emerald-400 transition-colors"
                            >
                              <CheckSquare
                                className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-stone-500'}`}
                              />
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold ${isDone ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                                {t.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                                <span>#{t.channelName}</span>
                                {t.dueDate && (
                                  <span className={t.isOverdue ? 'text-rose-400 font-bold' : ''}>
                                    • Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    {t.isOverdue ? ' (Overdue)' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Key Decisions */}
                <div className="p-4 rounded-2xl border bg-stone-950/50 border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-stone-200">Key Team Decisions</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                      {data.keyDecisions.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.keyDecisions.length === 0 ? (
                      <p className="text-xs text-stone-500 py-4 text-center italic">
                        No decisions recorded in this timeframe.
                      </p>
                    ) : (
                      data.keyDecisions.map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-xl border bg-stone-900/80 border-stone-800 hover:border-amber-500/40 transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs text-amber-300">{d.title}</p>
                            <span className="text-[10px] text-stone-500 font-mono">#{d.channelName}</span>
                          </div>
                          {d.rationale && (
                            <p className="text-[11px] text-stone-300 leading-snug">{d.rationale}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Section: Blockers/Risks & Pending Approvals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 3. Blockers & Risks */}
                <div className="p-4 rounded-2xl border bg-stone-950/50 border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <h3 className="text-sm font-bold text-stone-200">Blockers & Risks</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300">
                      {data.blockersAndRisks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.blockersAndRisks.length === 0 ? (
                      <p className="text-xs text-stone-500 py-3 text-center italic">
                        No high-priority blockers identified.
                      </p>
                    ) : (
                      data.blockersAndRisks.map((r, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border bg-rose-950/20 border-rose-500/30 flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200">
                              {r.severity}
                            </span>
                            <p className="text-xs font-semibold text-stone-200 mt-1">{r.title}</p>
                          </div>
                          <span className="text-[10px] text-stone-500 font-mono">#{r.channelName}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Pending Approvals */}
                <div className="p-4 rounded-2xl border bg-stone-950/50 border-stone-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-sky-400" />
                      <h3 className="text-sm font-bold text-stone-200">Pending Approvals</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300">
                      {data.pendingApprovals.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.pendingApprovals.length === 0 ? (
                      <p className="text-xs text-stone-500 py-3 text-center italic">
                        No pending sign-offs or approvals.
                      </p>
                    ) : (
                      data.pendingApprovals.map((app, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border bg-sky-950/20 border-sky-500/30 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-semibold text-stone-200">{app.item}</p>
                            <p className="text-[10px] text-stone-400">From @{app.requester}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                            {app.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Channel Highlights */}
              {data.channelHighlights && data.channelHighlights.length > 0 && (
                <div className="p-4 rounded-2xl border bg-stone-950/50 border-stone-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-stone-200">Channel Highlights</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.channelHighlights.map((ch, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (ch.channelId) {
                            setActiveChannel(ch.channelId);
                            setDailyBriefingOpen(false);
                          }
                        }}
                        className="p-3 rounded-xl border bg-stone-900/60 border-stone-800 hover:border-violet-500/40 transition-all cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-violet-400">#{ch.channelName}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-xs text-stone-300 leading-snug">{ch.highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-12 text-stone-500">Failed to load briefing.</p>
          )}
        </div>
      </div>
    </div>
  );
};
