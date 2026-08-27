import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookmarkCheck,
  ArrowUpRight,
  Plus,
  Sparkles,
  Award,
  Zap,
  Bell,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useContextDecisionsQuery } from '../../../hooks';
import { chatService } from '../../../services';
import { MessageTagType, DecisionRecord, DecisionStatus } from '@team-chat/shared';
import { Avatar, Button } from '../../../components/ui';

const TAG_CONFIG: Record<
  MessageTagType,
  { label: string; icon: typeof Award; color: string; bg: string; border: string }
> = {
  DECISION: {
    label: 'Decision',
    icon: Award,
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-muted)',
    border: 'var(--color-active-border)',
  },
  KEY_TAKEAWAY: {
    label: 'Key takeaway',
    icon: Sparkles,
    color: '#16a34a',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    icon: Bell,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    border: 'rgba(14,165,233,0.3)',
  },
  FOLLOW_UP: {
    label: 'Follow up',
    icon: Zap,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.3)',
  },
};

const STATUS_STYLE: Record<DecisionStatus, { label: string; color: string; bg: string; border: string }> = {
  APPROVED: {
    label: 'Approved',
    color: '#16a34a',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
  },
  UNDER_REVIEW: {
    label: 'Under review',
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-muted)',
    border: 'var(--color-active-border)',
  },
  SUPERSEDED: {
    label: 'Superseded',
    color: 'var(--color-text-tertiary)',
    bg: 'var(--color-elevated)',
    border: 'var(--color-border)',
  },
};

/** Prefer readable chat text; drop raw model “thinking” dumps. */
function messageSnippet(content: string): string {
  let text = content.trim();
  const thinkingIdx = text.search(/here'?s a thinking process/i);
  if (thinkingIdx > 0) {
    text = text.slice(0, thinkingIdx).trim();
  } else if (thinkingIdx === 0) {
    const finalMatch = text.match(
      /(?:final(?:\s+(?:answer|response))?|response|summary)\s*:\s*([\s\S]+)/i,
    );
    text = (finalMatch?.[1] ?? text).trim();
  }
  text = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Tagged message';
  return text.length > 220 ? `${text.slice(0, 217)}…` : text;
}

export const ChannelDecisionsPanel: React.FC = () => {
  const {
    jumpToMessage,
    activeId,
    activeType,
    openRecordDecision,
    openExtractWorkForTarget,
  } = useUiStore();
  const [selectedTag, setSelectedTag] = useState<'ALL' | MessageTagType>('ALL');
  const queryClient = useQueryClient();

  const taggedMessagesQuery = useContextDecisionsQuery();
  const structuredDecisionsQuery = useQuery({
    queryKey: ['aiDecisions', activeType, activeId],
    queryFn: () =>
      chatService.getAiDecisions({
        channelId: activeType === 'channel' ? activeId : undefined,
      }),
    enabled: Boolean(activeId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteAiDecision(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['aiDecisions'] });
    },
  });

  const messages = taggedMessagesQuery.data ?? [];
  const structuredDecisions: DecisionRecord[] = structuredDecisionsQuery.data ?? [];

  const filteredMessages = useMemo(() => {
    if (selectedTag === 'ALL') return messages;
    return messages.filter((m) => m.tags?.some((t) => t.tag === selectedTag));
  }, [messages, selectedTag]);

  const showStructured = selectedTag === 'ALL' || selectedTag === 'DECISION';
  const visibleStructured = showStructured ? structuredDecisions : [];
  const totalVisible = filteredMessages.length + visibleStructured.length;
  const allCount = messages.length + structuredDecisions.length;

  const handleJump = (messageId: string) => {
    jumpToMessage({
      messageId,
      channelId: activeType === 'channel' ? activeId : undefined,
      conversationId: activeType === 'conversation' ? activeId : undefined,
    });
  };

  const openAiExtract = () => {
    openExtractWorkForTarget({
      channelId: activeType === 'channel' ? activeId : undefined,
      conversationId: activeType === 'conversation' ? activeId : undefined,
    });
  };

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--color-main)' }}>
      <div
        className="space-y-3 border-b p-4"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-header)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Decisions
              </h3>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)' }}
              >
                {allCount}
              </span>
            </div>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Recorded agreements and tagged highlights from this chat
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="gap-1"
              onClick={openAiExtract}
              title="Extract decisions and tasks with AI"
            >
              <Sparkles className="h-3 w-3" />
              AI extract
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xs"
              className="gap-1"
              onClick={() =>
                openRecordDecision({
                  channelId: activeType === 'channel' ? activeId : undefined,
                })
              }
            >
              <Plus className="h-3 w-3" />
              Record
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag('ALL')}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
            style={{
              background: selectedTag === 'ALL' ? 'var(--color-accent-muted)' : 'transparent',
              color: selectedTag === 'ALL' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              border:
                selectedTag === 'ALL'
                  ? '1px solid var(--color-active-border)'
                  : '1px solid transparent',
            }}
          >
            All ({allCount})
          </button>
          {(Object.keys(TAG_CONFIG) as MessageTagType[]).map((t) => {
            const cfg = TAG_CONFIG[t];
            const Icon = cfg.icon;
            const active = selectedTag === t;
            const count = messages.filter((m) => m.tags?.some((tg) => tg.tag === t)).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(t)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--color-text-secondary)',
                  border: active ? `1px solid ${cfg.border}` : '1px solid transparent',
                }}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
                {count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {taggedMessagesQuery.isLoading || structuredDecisionsQuery.isLoading ? (
          <div
            className="flex h-48 flex-col items-center justify-center gap-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs">Loading decisions...</span>
          </div>
        ) : totalVisible === 0 ? (
          <div
            className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <BookmarkCheck className="mb-2 h-8 w-8" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
              No decisions yet
            </p>
            <p className="mt-1 max-w-[240px] text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Record a decision, tag a message, or use AI extract to pull agreements from the conversation.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="mt-3 gap-1"
              onClick={() =>
                openRecordDecision({
                  channelId: activeType === 'channel' ? activeId : undefined,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Record decision
            </Button>
          </div>
        ) : (
          <>
            {visibleStructured.length > 0 && (
              <div className="space-y-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Recorded decisions
                </p>
                {visibleStructured.map((dec) => {
                  const st = STATUS_STYLE[dec.status] ?? STATUS_STYLE.APPROVED;
                  return (
                    <div
                      key={dec.id}
                      className="group space-y-2 rounded-xl border p-3.5"
                      style={{
                        background: 'var(--color-elevated)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-1.5">
                          <Award
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            style={{ color: 'var(--color-accent)' }}
                          />
                          <span
                            className="text-xs font-semibold leading-snug"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {dec.title}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{
                              background: st.bg,
                              color: st.color,
                              border: `1px solid ${st.border}`,
                            }}
                          >
                            {st.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this decision record?')) {
                                deleteMutation.mutate(dec.id);
                              }
                            }}
                            className="rounded-md p-1 opacity-0 transition-opacity hover-surface group-hover:opacity-100"
                            style={{ color: 'var(--color-danger, #f43f5e)' }}
                            aria-label="Delete decision"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {dec.rationale && (
                        <p
                          className="line-clamp-3 border-l-2 pl-2 text-[11px] leading-relaxed"
                          style={{
                            borderColor: 'var(--color-accent)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {dec.rationale}
                        </p>
                      )}

                      <div
                        className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-[10px]"
                        style={{
                          borderColor: 'var(--color-border-subtle)',
                          color: 'var(--color-text-tertiary)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {dec.decidedByName && <span>By {dec.decidedByName}</span>}
                          <span>
                            {new Date(dec.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {dec.impactedAreas?.map((a) => (
                            <span
                              key={a}
                              className="rounded border px-1 py-0.5"
                              style={{
                                background: 'var(--color-input)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      {dec.messageId && (
                        <button
                          type="button"
                          onClick={() => handleJump(dec.messageId!)}
                          className="flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          View context
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredMessages.length > 0 && (
              <div className="space-y-2">
                {visibleStructured.length > 0 && (
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Tagged in chat
                  </p>
                )}
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="group space-y-2 rounded-xl border p-3.5 transition-colors"
                    style={{
                      background: 'var(--color-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          src={msg.senderAvatar}
                          name={msg.senderName}
                          size="xs"
                          className="h-4 w-4 text-[9px]"
                        />
                        <span
                          className="truncate text-xs font-medium"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {msg.senderName}
                        </span>
                        <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
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
                        onClick={() => handleJump(msg.id)}
                        className="flex items-center gap-1 text-[11px] font-medium opacity-70 transition-opacity group-hover:opacity-100"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        Jump
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>

                    <p
                      className="line-clamp-3 border-l-2 pl-2 text-xs leading-relaxed"
                      style={{
                        borderColor: 'var(--color-accent)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {messageSnippet(msg.content)}
                    </p>

                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.tags.map((tg) => {
                          const cfg = TAG_CONFIG[tg.tag] || TAG_CONFIG.DECISION;
                          const Icon = cfg.icon;
                          return (
                            <span
                              key={tg.id}
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                borderColor: cfg.border,
                              }}
                            >
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
