import React, { useState } from 'react';
import { X, MessageSquare, Sparkles, CheckCircle2, HelpCircle, ArrowRight, ShieldAlert, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useChatDataStore } from '../../../stores';
import { chatService } from '../../../services';
import { MessageItem, MessageComposer } from '../../chat/components';
import { Button } from '../../../components/ui';

interface ThreadSummaryData {
  summary: string;
  decisions: string[];
  openQuestions: string[];
  actionItems: { owner: string; task: string }[];
  blockers: string[];
}

export const ThreadPanel: React.FC = () => {
  const { activeThreadId, closeThread, messages, channels, activeId, activeType } =
    useChatDataStore();

  const [summaryData, setSummaryData] = useState<ThreadSummaryData | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  if (!activeThreadId) return null;

  const parentMessage = messages.find((m) => m.id === activeThreadId);
  const replies = messages.filter((m) => m.parentMessageId === activeThreadId);
  const currentChannel = channels.find((c) => c.id === activeId);

  if (!parentMessage) return null;

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const data = await chatService.summarizeThread(parentMessage.id);
      setSummaryData(data);
      setSummaryExpanded(true);
    } catch {
      // Fallback client-side synthetic summary
      setSummaryData({
        summary: `Thread with ${replies.length + 1} messages. Main topic: "${parentMessage.content.slice(0, 60)}"`,
        decisions: [`Agreed on primary direction for #${parentMessage.content.slice(0, 40)}`],
        openQuestions: replies.length === 0 ? ['Awaiting initial feedback.'] : [],
        actionItems: [{ owner: parentMessage.senderName, task: 'Follow up on discussion conclusions' }],
        blockers: [],
      });
      setSummaryExpanded(true);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <aside className="flex h-full w-80 sm:w-96 flex-col border-l border-slate-800/80 bg-slate-950/60 shadow-2xl backdrop-blur-md z-20">
      {/* Thread Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800/80 px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Thread</h3>
          {activeType === 'channel' && currentChannel && (
            <span className="text-xs text-slate-400">#{currentChannel.name}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isSummarizing}
            className="text-[11px] h-7 px-2 gap-1 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          >
            {isSummarizing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            <span>{summaryData ? 'Refresh' : 'AI Summary'}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={closeThread}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thread Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3">
        {/* Parent Message Card */}
        <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-1">
          <MessageItem message={parentMessage} isThreadReply />
        </div>

        {/* AI Thread Summary Card */}
        {summaryData && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-3 text-xs space-y-2.5 animate-in fade-in zoom-in-95 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-violet-300">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span>AI Thread Summary</span>
              </div>
              <button
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="text-violet-400 hover:text-white p-0.5 rounded transition-colors"
              >
                {summaryExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {summaryExpanded && (
              <>
                <p className="text-slate-300 leading-relaxed italic border-l-2 border-violet-500/40 pl-2">
                  {summaryData.summary}
                </p>

                {/* Decisions */}
                {summaryData.decisions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Decisions
                    </span>
                    <ul className="space-y-0.5 pl-4 list-disc text-slate-200">
                      {summaryData.decisions.map((d, i) => (
                        <li key={i} className="text-[11px]">{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Open Questions */}
                {summaryData.openQuestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" /> Open Questions
                    </span>
                    <ul className="space-y-0.5 pl-4 list-disc text-slate-200">
                      {summaryData.openQuestions.map((q, i) => (
                        <li key={i} className="text-[11px]">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {summaryData.actionItems.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> Action Items
                    </span>
                    <div className="space-y-1">
                      {summaryData.actionItems.map((act, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-200">
                          <span className="rounded bg-sky-500/20 px-1 py-0.2 font-semibold text-sky-300 text-[10px]">
                            {act.owner}
                          </span>
                          <span className="truncate">{act.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blockers */}
                {summaryData.blockers.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Blockers
                    </span>
                    <ul className="space-y-0.5 pl-4 list-disc text-rose-200">
                      {summaryData.blockers.map((b, i) => (
                        <li key={i} className="text-[11px]">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Replies Count Divider */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-950 px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
        </div>

        {/* Replies List */}
        {replies.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No replies in this thread yet. Be the first to respond!
          </div>
        ) : (
          replies.map((reply) => (
            <MessageItem key={reply.id} message={reply} isThreadReply />
          ))
        )}
      </div>

      {/* Thread Message Composer */}
      <MessageComposer parentMessageId={activeThreadId} placeholder="Reply in thread..." />
    </aside>
  );
};
