import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Edit3,
  X,
  Copy,
  CheckSquare,
  ArrowRight,
  Bot,
  Loader2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { useChatMutations, useWorkspace } from '../../../hooks';
import { useUiStore } from '../../../stores';
import { ActionItemStatus } from '@team-chat/shared';

export interface AiProposal {
  type: 'action_item' | 'summary' | 'draft_reply';
  title?: string;
  content: string;
  assigneeName?: string;
  assigneeId?: string;
  dueDate?: string;
  status?: ActionItemStatus;
  messageId?: string;
}

interface AiProposalCardProps {
  proposal: AiProposal;
  onDismiss?: () => void;
}

export const AiProposalCard: React.FC<AiProposalCardProps> = ({ proposal, onDismiss }) => {
  const { createActionItem } = useChatMutations();
  const { currentUser } = useWorkspace();
  const { activeId, activeType } = useUiStore();

  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApproveAction = async () => {
    if (isSubmitting || approved) return;
    setIsSubmitting(true);
    try {
      if (proposal.type === 'action_item') {
        await createActionItem.mutateAsync({
          title: proposal.title || proposal.content.slice(0, 80),
          description: proposal.content,
          assigneeId: proposal.assigneeId || currentUser.id,
          dueDate: proposal.dueDate,
          status: proposal.status || 'TODO',
          messageId: proposal.messageId,
          channelId: activeType === 'channel' ? activeId : undefined,
          conversationId: activeType === 'conversation' ? activeId : undefined,
        });
      }
      setApproved(true);
    } catch (err) {
      console.error('Failed to commit AI proposal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl bg-gradient-to-br from-indigo-950/40 via-stone-900/80 to-purple-950/30 border border-indigo-500/30 shadow-lg p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {proposal.type === 'action_item'
              ? 'AI Suggested Action Item'
              : proposal.type === 'summary'
              ? 'AI Generated Summary'
              : 'AI Drafted Reply'}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-normal bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
            Requires Approval
          </span>
        </div>

        {onDismiss && !approved && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Dismiss proposal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Preview */}
      <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 text-xs text-stone-200 space-y-1.5">
        {proposal.title && (
          <p className="font-semibold text-stone-100">{proposal.title}</p>
        )}
        <p className="leading-relaxed text-stone-300 whitespace-pre-wrap">
          {proposal.content}
        </p>

        {proposal.type === 'action_item' && (
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-stone-800/50 text-[10px] text-stone-400">
            {proposal.assigneeName && (
              <span className="flex items-center gap-1 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                <UserIcon className="w-3 h-3 text-indigo-400" />
                Assignee: {proposal.assigneeName}
              </span>
            )}
            {proposal.dueDate && (
              <span className="flex items-center gap-1 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Due: {new Date(proposal.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Human-in-the-loop Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {approved ? (
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Approved & Created</span>
            </div>
          ) : (
            <>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                >
                  Reject
                </button>
              )}
              <button
                type="button"
                onClick={handleApproveAction}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Create</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
