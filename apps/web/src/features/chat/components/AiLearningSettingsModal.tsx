import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Check,
  ToggleLeft,
  ToggleRight,
  Loader2,
  HelpCircle,
  Lightbulb,
  Shield,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { AiLearningRule } from '@team-chat/shared';

export const AiLearningSettingsModal: React.FC = () => {
  const { aiLearningModalOpen, setAiLearningModalOpen } = useUiStore();
  const { currentUser } = useWorkspace();
  const queryClient = useQueryClient();

  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState('general');

  const rulesQuery = useQuery({
    queryKey: ['aiRules'],
    queryFn: () => chatService.getAiRules(),
    enabled: aiLearningModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: () => chatService.createAiRule({ rule: newRule, category: newCategory }),
    onSuccess: () => {
      setNewRule('');
      void queryClient.invalidateQueries({ queryKey: ['aiRules'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      chatService.toggleAiRule(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['aiRules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteAiRule(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['aiRules'] });
    },
  });

  if (!aiLearningModalOpen) return null;

  const rules: AiLearningRule[] = rulesQuery.data ?? [];

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim() || createMutation.isPending) return;
    createMutation.mutate();
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
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
              }}
            >
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Learning & Team Guidelines</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Continuous Feedback Loop
                </span>
              </div>
              <p className="text-xs text-stone-400">
                AI continuously learns from approved human edits and corrections to improve future responses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAiLearningModalOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* How it works info card */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-stone-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-violet-300">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>How Learning from Corrections Works</span>
            </div>
            <p className="leading-relaxed text-stone-400">
              When teammates edit AI-generated action items, polish draft replies, or click &ldquo;Teach AI&rdquo;,
              the system distills actionable team guidelines. These active rules are automatically injected into future AI prompts.
            </p>
          </div>

          {/* Add Manual Rule Form */}
          <form onSubmit={handleAddRule} className="p-4 rounded-xl border bg-stone-950/60 border-stone-800/80 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
              Add Custom Team Preference / Instruction
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="E.g., 'Always format release notes with Jira bullet points'..."
                className="flex-1 rounded-xl px-3 py-2 text-xs bg-stone-900 text-stone-100 border border-stone-800 focus:outline-none focus:border-violet-500"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-xl px-2.5 py-2 text-xs bg-stone-900 text-stone-200 border border-stone-800 focus:outline-none"
              >
                <option value="general">General</option>
                <option value="tone">Tone & Style</option>
                <option value="action_items">Action Items</option>
                <option value="decisions">Decisions</option>
                <option value="routing">Routing</option>
              </select>
              <button
                type="submit"
                disabled={!newRule.trim() || createMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>Add Guideline</span>
              </button>
            </div>
          </form>

          {/* Active Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Active Learned Guidelines ({rules.length})
              </h3>
            </div>

            {rulesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-stone-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span className="text-xs">Loading learned guidelines...</span>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-10 text-stone-500 border border-dashed border-stone-800 rounded-xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50 text-violet-400" />
                <p className="text-xs font-medium text-stone-300">No learned guidelines recorded yet</p>
                <p className="text-[11px] mt-1 text-stone-500">
                  Edit an AI suggestion or add a custom rule above to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                      r.active
                        ? 'bg-stone-950/60 border-stone-800 hover:border-violet-500/30'
                        : 'bg-stone-950/30 border-stone-900 opacity-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {r.category}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium text-stone-200 leading-snug">{r.rule}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}
                        className="p-1 text-stone-400 hover:text-white transition-colors"
                        title={r.active ? 'Disable rule' : 'Enable rule'}
                      >
                        {r.active ? (
                          <ToggleRight className="w-6 h-6 text-violet-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-stone-600" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(r.id)}
                        className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
