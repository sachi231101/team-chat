import React, { useState } from 'react';
import { BarChart2, Plus, Trash2, X, CheckSquare, EyeOff } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { chatService } from '../../../services';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/useChatQueries';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isMultiChoice, setIsMultiChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeId, activeType, setError } = useUiStore();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setError('Please enter a poll question');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Please enter at least 2 valid options');
      return;
    }

    setIsSubmitting(true);
    try {
      await chatService.createPoll({
        question: cleanQuestion,
        options: cleanOptions,
        isMultiChoice,
        isAnonymous,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeType, activeId) });
      onClose();
      setQuestion('');
      setOptions(['', '']);
      setIsMultiChoice(false);
      setIsAnonymous(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
        style={{
          background: 'var(--color-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Create a Poll
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                Ask your team and collect live votes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Question Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Question
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Which design direction should we pick?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500"
              style={{
                background: 'var(--color-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Options (2 to 10)
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 text-right font-mono text-xs text-stone-500 font-bold">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500"
                    style={{
                      background: 'var(--color-input)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="rounded p-1.5 text-stone-500 hover:text-rose-400 transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Settings Toggles */}
          <div
            className="space-y-2 rounded-xl p-3 border"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Allow multiple choices
                </span>
              </div>
              <input
                type="checkbox"
                checked={isMultiChoice}
                onChange={(e) => setIsMultiChoice(e.target.checked)}
                className="h-4 w-4 rounded accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Anonymous responses
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded accent-violet-500"
              />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 shadow-md"
              style={{ background: 'var(--color-accent)' }}
            >
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
