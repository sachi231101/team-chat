import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Users,
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Award,
  Send,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { MultiAgentCoordinationResult, AgentCollaborationStep } from '@team-chat/shared';

const PRESET_OBJECTIVES = [
  'Analyze production incident logs and produce a verified fix & post-mortem',
  'Turn recent chat roadmap discussions into a structured technical PRD',
  'Audit API authentication security and draft compliance action items',
  'Synthesize quarterly engineering goals with owner checklists and risks',
];

export const MultiAgentStudio: React.FC = () => {
  const { multiAgentStudioOpen, setMultiAgentStudioOpen, activeId, activeType } = useUiStore();
  const { currentUser } = useWorkspace();
  const queryClient = useQueryClient();

  const [objective, setObjective] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([
    'ResearchAgent',
    'SupportAgent',
    'MeetingAgent',
  ]);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true, 4: true, 5: true });
  const [result, setResult] = useState<MultiAgentCoordinationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const coordinateMutation = useMutation({
    mutationFn: () =>
      chatService.coordinateMultiAgent({
        objective,
        participatingAgents: selectedAgents,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
      }),
    onSuccess: (data) => {
      setResult(data);
      // Auto-expand all steps on completion
      const all: Record<number, boolean> = {};
      data.steps.forEach((s) => {
        all[s.stepIndex] = true;
      });
      setExpandedSteps(all);
    },
  });

  if (!multiAgentStudioOpen) return null;

  const handleToggleAgent = (name: string) => {
    setSelectedAgents((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const handleToggleStep = (stepIndex: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepIndex]: !prev[stepIndex],
    }));
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.finalResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToChannel = async () => {
    if (!result || isPosting) return;
    setIsPosting(true);
    try {
      await chatService.sendMessage({
        content: `### 🤖 Multi-Agent Verified Output\n**Objective:** ${result.objective}\n\n${result.finalResult}`,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMultiAgentStudioOpen(false);
    } catch (err) {
      console.error('Failed to post result:', err);
    } finally {
      setIsPosting(false);
    }
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
              }}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Multi-Agent Coordination Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Swarm Engine
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Orchestrate specialized AI workers in parallel to solve complex objectives and return verified results
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMultiAgentStudioOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Objective Input Area */}
          <div className="p-4 rounded-2xl border bg-stone-950/60 border-stone-800/80 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
              1. Define Objective / Goal
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="What complex objective should the agent swarm solve? E.g. 'Audit the authentication flow and create a hardened migration plan'..."
              className="w-full rounded-xl p-3 text-sm bg-stone-900/90 text-stone-100 border border-stone-800 focus:outline-none focus:border-violet-500 leading-relaxed resize-none"
            />

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1.5">
                Suggested Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_OBJECTIVES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setObjective(p)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-stone-900 text-stone-300 border border-stone-800 hover:border-violet-500/50 hover:text-violet-300 transition-all text-left truncate max-w-xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Selectors */}
            <div className="pt-2 border-t border-stone-800/60">
              <span className="text-[10px] font-bold uppercase text-stone-500 block mb-2">
                2. Participating Specialized Agents
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'ResearchAgent', role: 'Memory & Evidence', icon: Search, color: 'text-sky-400' },
                  { name: 'SupportAgent', role: 'Technical Risks & Feasibility', icon: ShieldCheck, color: 'text-amber-400' },
                  { name: 'MeetingAgent', role: 'Executive Synthesis', icon: BookOpen, color: 'text-emerald-400' },
                ].map((ag) => {
                  const Icon = ag.icon;
                  const active = selectedAgents.includes(ag.name);
                  return (
                    <button
                      key={ag.name}
                      type="button"
                      onClick={() => handleToggleAgent(ag.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        active
                          ? 'bg-violet-500/20 text-violet-200 border-violet-500/40 shadow-sm'
                          : 'bg-stone-900 text-stone-500 border-stone-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${ag.color}`} />
                      <span>{ag.name}</span>
                      <span className="text-[10px] font-normal opacity-75">({ag.role})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => coordinateMutation.mutate()}
                disabled={!objective.trim() || coordinateMutation.isPending || selectedAgents.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg shadow-violet-600/30 transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                }}
              >
                {coordinateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Swarm Collaborating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Multi-Agent Workflow</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Collaboration Step Trace Timeline */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Agent Collaboration Trace ({result.steps.length} Steps)</span>
                </h3>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Deliverable ({(result.confidenceScore * 100).toFixed(0)}% Confidence)</span>
                </span>
              </div>

              {/* Step cards */}
              <div className="space-y-3">
                {result.steps.map((step) => {
                  const isExpanded = Boolean(expandedSteps[step.stepIndex]);
                  return (
                    <div
                      key={step.stepIndex}
                      className="rounded-xl border bg-stone-950/50 border-stone-800 overflow-hidden transition-all shadow-sm"
                    >
                      {/* Step Header */}
                      <button
                        type="button"
                        onClick={() => handleToggleStep(step.stepIndex)}
                        className="w-full flex items-center justify-between p-3.5 text-left bg-stone-900/60 hover:bg-stone-900 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
                            {step.stepIndex}
                          </span>
                          <span className="text-xs font-bold text-stone-200">{step.agentName}</span>
                          <span className="text-[11px] text-stone-400 font-normal">({step.role})</span>
                          <span className="text-[10px] text-stone-500">• {step.actionTaken}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </button>

                      {/* Step Content */}
                      {isExpanded && (
                        <div className="p-4 text-xs space-y-2.5 border-t border-stone-800/80 bg-stone-950/80">
                          <div className="text-stone-400 italic text-[11px] bg-stone-900/50 p-2 rounded-lg border border-stone-800/60">
                            💭 <strong>Agent Thought:</strong> {step.thought}
                          </div>
                          <div className="text-stone-200 leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                            {step.output}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 3. Final Verified Deliverable Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/40 via-stone-900 to-cyan-950/30 border border-cyan-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <span>Final Verified Synthesis</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePostToChannel}
                      disabled={isPosting}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post to Channel</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-100 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {result.finalResult}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
