import React, { useState } from 'react';
import {
  MessageSquare,
  Smile,
  Pin,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Edit2,
  Copy,
  Download,
  FileText,
  Check,
  Image as ImageIcon,
  Sparkles,
  CheckSquare,
  BookmarkCheck,
  Award,
  Zap,
  Bell,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Message, MessageTagType, ActionItemStatus } from '@team-chat/shared';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations } from '../../../hooks';
import { Avatar, Tooltip } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';
import { resolveAssetUrl } from '../../../lib/assets';
import { renderChatMarkdown } from '../lib/renderChatMarkdown';
import { PollCard } from './PollCard';
import { cn } from '../../../lib/utils';


export interface MessageItemProps {
  message: Message;
  isThreadReply?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🎉', '🔥', '👀', '💯', '✨'];

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

export const MessageItem: React.FC<MessageItemProps> = ({ message, isThreadReply = false }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [localEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { currentUser, conversations } = useWorkspace();
  const { savedMessageIds } = useWorkspace();
  const {
    openThread,
    setActiveConversation,
    focusMessageId,
    editingMessageId,
    setEditingMessageId,
    openCreateActionForMessage,
    openExtractWorkForTarget,
    openRecordDecision,
    setAiLearningModalOpen,
  } = useUiStore();

  const isEditing = localEditing || editingMessageId === message.id;

  React.useEffect(() => {
    if (editingMessageId === message.id) {
      setEditContent(message.content);
    }
  }, [editingMessageId, message.id, message.content]);
  const {
    toggleReaction,
    togglePin,
    toggleSave,
    deleteMessage,
    editMessage,
    createConversation,
    toggleMessageTag,
    updateActionItem,
    sendMessage,
  } = useChatMutations();

  const isAuthor = message.senderId === currentUser.id;
  const isSaved = savedMessageIds.includes(message.id);
  const isAiBot =
    message.senderId?.startsWith('usr-agent-') ||
    message.senderName?.includes('Agent') ||
    message.senderName?.includes('Assistant');

  // Group reactions by emoji
  const reactionGroups = (message.reactions || []).reduce(
    (acc, curr) => {
      if (!acc[curr.emoji]) acc[curr.emoji] = { count: 0, users: [], hasReacted: false };
      acc[curr.emoji].count += 1;
      acc[curr.emoji].users.push(curr.userName);
      if (curr.userId === currentUser.id) acc[curr.emoji].hasReacted = true;
      return acc;
    },
    {} as Record<string, { count: number; users: string[]; hasReacted: boolean }>,
  );

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage.mutate({ id: message.id, content: editContent.trim() });
    }
    setIsEditing(false);
    setEditingMessageId(null);
  };


  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setShowMoreActions(false);
  };

  const openSenderChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const senderId = message.senderId;
    if (!senderId) return;

    const existing = conversations.find((c) => {
      const unique = Array.from(new Set(c.participants));
      if (senderId === currentUser.id) {
        return unique.length === 1 && unique[0] === currentUser.id;
      }
      return (
        unique.length === 2 &&
        unique.includes(currentUser.id) &&
        unique.includes(senderId)
      );
    });

    if (existing) {
      setActiveConversation(existing.id);
      return;
    }
    createConversation.mutate(senderId);
  };

  const handleToggleActionStatus = (actionId: string, currentStatus: ActionItemStatus) => {
    const nextStatus: ActionItemStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    updateActionItem.mutate({ id: actionId, data: { status: nextStatus } });
  };

  const handleRetrySend = () => {
    sendMessage.mutate({
      content: message.content,
      parentMessageId: message.parentMessageId,
      clientMessageId: message.clientMessageId,
    });
  };

  return (
    <div
      id={`msg-${message.id}`}
      data-message-id={message.id}
      className="group relative flex gap-3 px-4 py-1.5 transition-colors"
      style={{
        background: hovered
          ? 'rgba(255,255,255,0.025)'
          : focusMessageId === message.id
            ? 'var(--color-accent-muted)'
            : 'transparent',
        outline: focusMessageId === message.id ? '1px solid var(--color-active-border)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Avatar ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openSenderChat}
        className="mt-0.5 shrink-0 rounded-lg transition-opacity hover:opacity-80"
        title={`Message ${message.senderName}`}
      >
        <Avatar
          name={message.senderName}
          src={message.senderAvatar}
          size={isThreadReply ? 'sm' : 'md'}
        />
      </button>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Header: name + timestamp + badges */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <button
            type="button"
            onClick={openSenderChat}
            className="text-[15px] font-bold hover:underline"
            style={{ color: 'var(--color-text-primary)' }}
            title={`Message ${message.senderName}`}
          >
            {message.senderName}
          </button>
          {isAiBot && (
            <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Sparkles className="h-3 w-3" />
              <span>AI Teammate</span>
            </span>
          )}
          <span
            className="text-xs leading-none"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {formatTimestamp(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs italic" style={{ color: 'var(--color-text-tertiary)' }}>
              (edited)
            </span>
          )}
          {message.pinned && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold"
              style={{
                background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <Pin className="h-2.5 w-2.5" /> Pinned
            </span>
          )}
          {/* Outbox delivery status indicators */}
          {message.deliveryStatus === 'sending' && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Sending...</span>
            </span>
          )}
          {message.deliveryStatus === 'failed' && (
            <button
              type="button"
              onClick={handleRetrySend}
              className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 hover:bg-rose-500/20"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Failed. Click to retry</span>
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Content or Edit input */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg p-2.5 text-[15px] leading-relaxed focus:outline-none"
              style={{
                background: 'var(--color-input)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-text-primary)',
              }}
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                if (e.key === 'Escape') { setIsEditing(false); setEditingMessageId(null); setEditContent(message.content); }
              }}
            />
            <div className="flex gap-2 text-xs">
              <button
                onClick={handleSaveEdit}
                className="rounded-md px-3 py-1 font-semibold text-white transition-colors"
                style={{ background: 'var(--color-accent)' }}
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditingMessageId(null); setEditContent(message.content); }}
                className="rounded-md px-3 py-1 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mt-1 text-[15px] leading-relaxed select-text"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {renderChatMarkdown(message.content)}
          </div>
        )}

        {/* Attached Tags (Pillar 4: Context Preservation) */}
        {message.tags && message.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {message.tags.map((t) => {
              const cfg = TAG_CONFIG[t.tag] || TAG_CONFIG.DECISION;
              const Icon = cfg.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleMessageTag.mutate({ messageId: message.id, tag: t.tag })}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all ${cfg.bg} ${cfg.color} ${cfg.border} hover:opacity-80`}
                  title={`Tagged as ${cfg.label} (Click to remove)`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Attached Action Items (Pillar 5: Action Management) */}
        {message.actionItems && message.actionItems.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.actionItems.map((act) => {
              const isDone = act.status === 'DONE';
              return (
                <div
                  key={act.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                    isDone
                      ? 'bg-stone-950/30 border-stone-800/40 opacity-75'
                      : 'bg-stone-950/80 border-emerald-500/30 shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleActionStatus(act.id, act.status)}
                    className="text-stone-400 hover:text-emerald-400 transition-colors"
                  >
                    <CheckSquare
                      className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-400' : 'text-stone-500'}`}
                    />
                  </button>
                  <span
                    className={`flex-1 font-medium truncate ${
                      isDone ? 'line-through text-stone-500' : 'text-stone-200'
                    }`}
                  >
                    {act.title}
                  </span>
                  {act.assigneeName && (
                    <span className="px-1.5 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-800 text-[10px]">
                      @{act.assigneeName}
                    </span>
                  )}
                  {act.dueDate && (
                    <span className="text-[10px] text-stone-400">
                      Due {new Date(act.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Poll */}
        {message.poll && <PollCard poll={message.poll} />}

        {/* Attachments */}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => {
              const assetUrl = resolveAssetUrl(att.url);
              const isImg = att.type.startsWith('image/');
              const isVideo = att.type.startsWith('video/');
              const isAudio = att.type.startsWith('audio/');

              if (isImg) {
                return (
                  <div
                    key={att.id}
                    className="group/img relative overflow-hidden rounded-xl w-full max-w-md transition-all"
                    style={{
                      background: 'var(--color-elevated)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="relative max-h-80 w-full overflow-hidden">
                      <img
                        src={assetUrl}
                        alt={att.name}
                        className="max-h-80 w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <ImageIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {att.name}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                            {(att.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                      <a
                        href={assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1.5 transition-colors hover:bg-white/10"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              }

              if (isVideo) {
                return (
                  <div
                    key={att.id}
                    className="w-full max-w-md overflow-hidden rounded-xl"
                    style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
                  >
                    <video src={assetUrl} controls className="max-h-80 w-full bg-black" />
                    <div className="flex items-center justify-between p-2.5">
                      <span className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {att.name}
                      </span>
                      <a href={assetUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-tertiary)' }}>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              }

              if (isAudio) {
                return (
                  <div
                    key={att.id}
                    className="w-full max-w-md rounded-xl p-3"
                    style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
                  >
                    <p className="mb-2 truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {att.name}
                    </p>
                    <audio src={assetUrl} controls className="w-full" />
                  </div>
                );
              }

              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors"
                  style={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <FileText className="h-5 w-5 shrink-0" style={{ color: 'var(--color-accent)' }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {att.name}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {(att.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <a
                    href={assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 rounded p-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Reaction Pills */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <Tooltip key={emoji} content={`${data.users.join(', ')} reacted with ${emoji}`} side="top">
                <button
                  onClick={() => toggleReaction.mutate({ id: message.id, emoji })}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all active:scale-95"
                  style={{
                    background: data.hasReacted ? 'var(--color-accent-muted)' : 'rgba(255,255,255,0.04)',
                    border: data.hasReacted ? '1px solid var(--color-active-border)' : '1px solid var(--color-border)',
                    color: data.hasReacted ? '#c4b5fd' : 'var(--color-text-secondary)',
                  }}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px] font-bold">{data.count}</span>
                </button>
              </Tooltip>
            ))}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              <Smile className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Thread replies banner */}
        {!isThreadReply && (message.replyCount || 0) > 0 && (
          <button
            onClick={() => openThread(message.id)}
            className="mt-1.5 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition-colors"
            style={{ color: 'var(--color-accent)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>View thread →</span>
          </button>
        )}
      </div>

      {/* ── Floating Hover Action Bar ───────────────────────── */}
      {hovered && !isEditing && (
        <div
          className="absolute right-4 -top-4 flex items-center rounded-lg p-0.5 shadow-2xl z-20 animate-in zoom-in-95"
          style={{
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Quick emojis */}
          <div
            className="flex items-center px-0.5 gap-0.5"
            style={{ borderRight: '1px solid var(--color-border)' }}
          >
            {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction.mutate({ id: message.id, emoji })}
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition-all hover:scale-110"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Core Action Buttons */}
          <Tooltip content="Add reaction" side="top">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {!isThreadReply && (
            <Tooltip content="Reply in thread" side="top">
              <button
                onClick={() => openThread(message.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}

          {/* AI Advantage 1: Conversation-to-work */}
          <Tooltip content="Extract Work & Decisions (AI)" side="top">
            <button
              onClick={() => openExtractWorkForTarget({ messageId: message.id })}
              className="flex h-7 w-7 items-center justify-center rounded-md text-violet-400 hover:bg-violet-500/15 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Action Management: Create Action Item (Pillar 5) */}
          <Tooltip content="Turn into Action Item" side="top">
            <button
              onClick={() => openCreateActionForMessage(message)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-400 hover:bg-emerald-500/15 transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Context Preservation: Tag Decision / Highlight (Pillar 4 & 7) */}
          <Tooltip content="Tag Decision / Highlight" side="top">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-amber-400 hover:bg-amber-500/15 transition-colors"
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip content={message.pinned ? 'Unpin message' : 'Pin message'} side="top">
            <button
              onClick={() => togglePin.mutate(message.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{
                color: message.pinned ? 'var(--color-pin)' : 'var(--color-text-secondary)',
                background: message.pinned ? 'rgba(245,158,11,0.12)' : 'transparent',
              }}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip content={isSaved ? 'Remove from saved' : 'Save for later'} side="top">
            <button
              onClick={() => toggleSave.mutate(message.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{
                color: isSaved ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: isSaved ? 'rgba(124,58,237,0.12)' : 'transparent',
              }}
            >
              <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
            </button>
          </Tooltip>

          <Tooltip content="More actions" side="top">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Tag Dropdown Menu (Pillar 4) */}
          {showTagMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowTagMenu(false)} />
              <div
                className="absolute right-12 top-full mt-1 w-44 rounded-xl p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 bg-stone-900 border border-stone-800"
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  Tag Message As
                </div>
                {(['DECISION', 'KEY_TAKEAWAY', 'ANNOUNCEMENT', 'FOLLOW_UP'] as MessageTagType[]).map((t) => {
                  const cfg = TAG_CONFIG[t];
                  const Icon = cfg.icon;
                  const hasTag = message.tags?.some((x) => x.tag === t);
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        toggleMessageTag.mutate({ messageId: message.id, tag: t });
                        setShowTagMenu(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                        hasTag ? 'bg-amber-500/15 text-amber-300' : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </div>
                      {hasTag && <Check className="w-3 h-3 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* More dropdown */}
          {showMoreActions && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMoreActions(false)} />
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 bg-stone-900 border border-stone-800"
              >
                <button
                  onClick={() => { openCreateActionForMessage(message); setShowMoreActions(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Create Action Item</span>
                </button>
                <button
                  onClick={() => { toggleSave.mutate(message.id); setShowMoreActions(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current text-violet-400")} />
                  <span>{isSaved ? 'Remove from saved' : 'Save message'}</span>
                </button>

                <div className="my-1 border-t border-stone-800" />

                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy text'}</span>
                </button>
                {isAuthor && (
                  <>
                    <button
                      onClick={() => { setIsEditing(true); setShowMoreActions(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-sky-400" />
                      <span>Edit message</span>
                    </button>
                    <button
                      onClick={() => { deleteMessage.mutate(message.id); setShowMoreActions(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Emoji picker popover */}
      {showEmojiPicker && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
          <div
            className="absolute right-4 top-8 z-40 grid grid-cols-4 gap-1 rounded-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 bg-stone-900 border border-stone-800"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { toggleReaction.mutate({ id: message.id, emoji }); setShowEmojiPicker(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:scale-110 hover:bg-stone-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
