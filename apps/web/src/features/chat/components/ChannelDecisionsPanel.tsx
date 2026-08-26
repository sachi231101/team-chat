import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookmarkCheck,
  Tag,
  MessageSquare,
  Loader2,
  Calendar,
  Sparkles,
  Award,
  Zap,
  Bell,
  ArrowUpRight,
  Plus,
  Layers,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useContextDecisionsQuery, useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { Message, MessageTagType, DecisionRecord } from '@team-chat/shared';
import { Avatar } from '../../../components/ui';

const TAG_CONFIG: Record<
  MessageTagType,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  DECISION: {
    label: 'Decision',
    icon: Award,
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  KEY_TAKEAWAY: {
    label: 'Key Takeaway',
    icon: Sparkles,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    icon: Bell,
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  FOLLOW_UP: {
    label: 'Follow Up',
    icon: Zap,
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
};

export const ChannelDecisionsPanel: React.FC = () => {
  const { jumpToMessage, activeId, activeType, openRecordDecision, openExtractWorkForTarget } = useUiStore();
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const taggedMessagesQuery = useContextDecisionsQuery();
  const structuredDecisionsQuery = useQuery({
    queryKey: ['aiDecisions', activeId],
    queryFn: () => chatService.getAiDecisions({ channelId: activeType === 'channel' ? activeId : undefined }),
    enabled: Boolean(activeId),
  });

  const messages = taggedMessagesQuery.data ?? [];
  const structuredDecisions: DecisionRecord[] = structuredDecisionsQuery.data ?? [];

  const filteredMessages = messages.filter((m) => {
    if (selectedTag === 'ALL') return true;
    return m.tags?.some((t) => t.tag === selectedTag);
  });

  const totalCount = filteredMessages.length + structuredDecisions.length;

  return (
    <div className="flex flex-col h-full bg-stone-900/50">
      {/* Header Controls */}
      <div className="p-4 border-b border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-stone-200">Decision Registry</h3>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-800 text-stone-400">
              {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openExtractWorkForTarget({ channelId: activeId })}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
              title="Detect decisions with AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Detect</span>
            </button>
            <button
              type="button"
              onClick={() => openRecordDecision({ channelId: activeType === 'channel' ? activeId : undefined })}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              title="Record a new decision"
            >
              <Plus className="w-3 h-3" />
              <span>Record</span>
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSelectedTag('ALL')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              selectedTag === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'bg-stone-950/60 border border-stone-800/80 text-stone-400 hover:text-stone-300'
            }`}
          >
            All ({totalCount})
          </button>
          {(['DECISION', 'KEY_TAKEAWAY', 'ANNOUNCEMENT', 'FOLLOW_UP'] as MessageTagType[]).map((t) => {
            const cfg = TAG_CONFIG[t];
            const Icon = cfg.icon;
            const active = selectedTag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(t)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  active
                    ? `${cfg.bg} ${cfg.color} border ${cfg.border} font-semibold`
                    : 'bg-stone-950/60 border border-stone-800/80 text-stone-400 hover:text-stone-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {taggedMessagesQuery.isLoading || structuredDecisionsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-stone-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs">Loading decisions & takeaways...</span>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-stone-800 rounded-xl">
            <BookmarkCheck className="w-8 h-8 text-stone-600 mb-2" />
            <p className="text-xs font-medium text-stone-300">No decisions or highlights recorded</p>
            <p className="text-[11px] text-stone-500 mt-1 max-w-[220px]">
              Tag conclusions or click &ldquo;Record&rdquo; above to preserve agreements in the Decision Registry.
            </p>
          </div>
        ) : (
          <>
            {/* Structured Decisions from Registry */}
            {structuredDecisions.map((dec) => (
              <div
                key={dec.id}
                className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/20 to-stone-950/80 border border-amber-500/30 shadow-sm transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{dec.title}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                      dec.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : dec.status === 'UNDER_REVIEW'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {dec.status.replace('_', ' ')}
                  </span>
                </div>

                {dec.rationale && (
                  <p className="text-[11px] text-stone-300 leading-relaxed pl-2 border-l-2 border-amber-500/40">
                    {dec.rationale}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/60">
                  <div className="flex items-center gap-2">
                    {dec.decidedByName && <span>By: {dec.decidedByName}</span>}
                    <span>• {new Date(dec.createdAt).toLocaleDateString()}</span>
                  </div>

                  {dec.impactedAreas && dec.impactedAreas.length > 0 && (
                    <div className="flex gap-1">
                      {dec.impactedAreas.map((a, i) => (
                        <span key={i} className="px-1 rounded bg-stone-900 text-stone-400 border border-stone-800">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Tagged Messages */}
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="group p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:border-amber-500/30 shadow-sm transition-all space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={msg.senderAvatar}
                      name={msg.senderName}
                      size="xs"
                      className="w-4 h-4 text-[9px]"
                    />
                    <span className="text-xs font-medium text-stone-300">{msg.senderName}</span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(msg.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      jumpToMessage({
                        messageId: msg.id,
                        channelId: activeType === 'channel' ? activeId : undefined,
                        conversationId: activeType === 'conversation' ? activeId : undefined,
                      })
                    }
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-amber-400 hover:underline transition-opacity"
                  >
                    <span>Jump</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Message Content */}
                <p className="text-xs text-stone-200 leading-relaxed pl-1 border-l-2 border-amber-500/40">
                  {msg.content}
                </p>

                {/* Tag Pills */}
                {msg.tags && msg.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.tags.map((tg) => {
                      const cfg = TAG_CONFIG[tg.tag] || TAG_CONFIG.DECISION;
                      const Icon = cfg.icon;
                      return (
                        <span
                          key={tg.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                          {tg.userName && (
                            <span className="opacity-70 text-[9px]">by {tg.userName}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
