import React, { useState } from 'react';
import { BarChart2, Check, Lock, Users, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Poll } from '@team-chat/shared';
import { chatService } from '../../../services';
import { useWorkspace } from '../../../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/useChatQueries';
import { useUiStore } from '../../../stores';

interface PollCardProps {
  poll: Poll;
}

export const PollCard: React.FC<PollCardProps> = ({ poll: initialPoll }) => {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { currentUser } = useWorkspace();
  const { activeId, activeType, setError } = useUiStore();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  const isCreator = poll.createdById === currentUser.id;

  const handleVote = async (optionIndex: number) => {
    if (poll.isClosed || isVoting) return;
    setIsVoting(true);
    try {
      const updated = await chatService.votePoll(poll.id, optionIndex);
      setPoll(updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeType, activeId) });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleToggleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      const updated = await chatService.closePoll(poll.id, !poll.isClosed);
      setPoll(updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeType, activeId) });
    } catch (err: any) {
      setError(err?.message || 'Failed to update poll status');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div
      className="my-3 overflow-hidden rounded-2xl border shadow-xl transition-all max-w-lg"
      style={{
        background: 'var(--color-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b select-none"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
            <BarChart2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            Interactive Poll
          </span>
          {poll.isClosed ? (
            <span className="flex items-center gap-1 rounded-full bg-stone-500/20 px-2 py-0.5 text-[10px] font-semibold text-stone-400">
              <Lock className="h-2.5 w-2.5" /> Closed
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
          {poll.isMultiChoice && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium">Multiple choice</span>
          )}
          {poll.isAnonymous ? (
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium">Anonymous</span>
          ) : (
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium">Public votes</span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
          {poll.question}
        </h3>
      </div>

      {/* Options list */}
      <div className="px-4 pb-3 space-y-2">
        {poll.options.map((opt) => {
          const hasVoted = Boolean(opt.hasVoted);
          return (
            <div key={opt.index} className="space-y-1">
              <button
                type="button"
                disabled={poll.isClosed || isVoting}
                onClick={() => void handleVote(opt.index)}
                className={`relative w-full overflow-hidden rounded-xl border p-2.5 text-left transition-all group ${
                  poll.isClosed
                    ? 'cursor-default opacity-85'
                    : 'cursor-pointer hover:border-sky-500/50 active:scale-[0.99]'
                }`}
                style={{
                  background: 'var(--color-input)',
                  borderColor: hasVoted ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                {/* Progress bar background fill */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${opt.percentage}%`,
                    background: hasVoted ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  }}
                />

                {/* Option content */}
                <div className="relative flex items-center justify-between gap-3 z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-${
                        poll.isMultiChoice ? 'md' : 'full'
                      } border transition-colors ${
                        hasVoted
                          ? 'border-sky-400 bg-sky-500 text-white'
                          : 'border-stone-500/50 bg-transparent group-hover:border-sky-400'
                      }`}
                    >
                      {hasVoted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-xs font-semibold truncate ${
                        hasVoted ? 'text-sky-300' : 'text-stone-200'
                      }`}
                    >
                      {opt.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {opt.percentage}%
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      ({opt.voteCount})
                    </span>
                  </div>
                </div>
              </button>

              {/* Voter avatar badges (if not anonymous) */}
              {!poll.isAnonymous && opt.voters && opt.voters.length > 0 && (
                <div className="flex items-center gap-1 px-1 pt-0.5">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {opt.voters.slice(0, 5).map((v) => (
                      <div
                        key={v.id}
                        title={v.name}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[8px] font-bold text-white ring-1 ring-stone-900"
                      >
                        {v.avatarUrl ? (
                          <img src={v.avatarUrl} alt={v.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          v.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                  {opt.voters.length > 5 && (
                    <span className="text-[9px] text-stone-400 font-medium">
                      +{opt.voters.length - 5}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 truncate max-w-xs ml-1">
                    {opt.voters.map((v) => v.name).slice(0, 3).join(', ')}
                    {opt.voters.length > 3 ? ` and ${opt.voters.length - 3} others` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t text-[11px] select-none"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'var(--color-border-subtle)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <div className="flex items-center gap-2 font-medium">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>
              {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
            </span>
          </span>
          <span>·</span>
          <span>
            by <strong style={{ color: 'var(--color-text-secondary)' }}>{poll.creatorName || 'Member'}</strong>
          </span>
        </div>

        {/* Creator Controls */}
        {isCreator && (
          <button
            type="button"
            disabled={isClosing}
            onClick={() => void handleToggleClose()}
            className="rounded px-2 py-0.5 font-semibold text-[10px] transition-colors hover:bg-white/10"
            style={{ color: poll.isClosed ? 'var(--color-accent)' : '#f87171' }}
          >
            {poll.isClosed ? 'Reopen Poll' : 'Close Poll'}
          </button>
        )}
      </div>
    </div>
  );
};
