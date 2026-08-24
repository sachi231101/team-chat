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
  CheckSquare,
  FileCheck2,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { Message } from '@team-chat/shared';
import { useChatDataStore } from '../../../stores';
import { Avatar, Tooltip } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';
import { cn } from '../../../lib/utils';

export interface MessageItemProps {
  message: Message;
  isThreadReply?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🎉', '🔥', '👀', '💯', '✨'];

export const MessageItem: React.FC<MessageItemProps> = ({ message, isThreadReply = false }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);

  const {
    currentUser,
    toggleReaction,
    togglePin,
    toggleSaveMessage,
    savedMessageIds,
    deleteMessage,
    editMessage,
    openThread,
    openCreateTaskModal,
    openCreateApprovalModal,
    saveAsDecision,
  } = useChatDataStore();

  const isAuthor = message.senderId === currentUser.id;
  const isSaved = savedMessageIds.includes(message.id);
  const isAiBot = message.senderId?.startsWith('usr-agent-') || message.senderName?.includes('Agent');

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce(
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
      editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setShowMoreActions(false);
  };

  // Render markdown-like formatting
  const renderContent = (content: string) => {
    if (content.includes('```')) {
      const parts = content.split('```');
      return parts.map((part, idx) => {
        if (idx % 2 === 1) {
          const lines = part.trim().split('\n');
          const lang = lines[0];
          const code = lines.slice(1).join('\n') || lines[0];
          return (
            <pre
              key={idx}
              className="my-2 overflow-x-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
              style={{
                background: 'var(--color-code-bg)',
                border: '1px solid var(--color-code-border)',
                color: '#7dd3fc',
              }}
            >
              {lang && <div className="mb-1 text-[10px] font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{lang}</div>}
              <code>{code}</code>
            </pre>
          );
        }
        return <span key={idx} className="whitespace-pre-wrap">{renderInline(part)}</span>;
      });
    }
    return <span className="whitespace-pre-wrap">{renderInline(content)}</span>;
  };

  const renderInline = (text: string) => {
    // Bold **text**, inline `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((chunk, i) => {
      if (chunk.startsWith('**') && chunk.endsWith('**'))
        return <strong key={i} className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{chunk.slice(2, -2)}</strong>;
      if (chunk.startsWith('`') && chunk.endsWith('`'))
        return (
          <code
            key={i}
            className="rounded px-1 py-0.5 font-mono text-[11px]"
            style={{ background: 'var(--color-code-bg)', color: '#7dd3fc', border: '1px solid var(--color-code-border)' }}
          >
            {chunk.slice(1, -1)}
          </code>
        );
      return chunk;
    });
  };

  return (
    <div
      className="group relative flex gap-3 px-4 py-1.5 transition-colors"
      style={{ background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Avatar ─────────────────────────────────────────── */}
      <div className="mt-0.5 shrink-0">
        <Avatar
          name={message.senderName}
          src={message.senderAvatar}
          size={isThreadReply ? 'sm' : 'md'}
        />
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Header: name + timestamp + badges */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {message.senderName}
          </span>
          {isAiBot && (
            <span className="flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI Teammate</span>
            </span>
          )}
          <span
            className="text-[11px] leading-none"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {formatTimestamp(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-[10px] italic" style={{ color: 'var(--color-text-tertiary)' }}>
              (edited)
            </span>
          )}
          {message.pinned && (
            <span
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold"
              style={{
                background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <Pin className="h-2 w-2" /> Pinned
            </span>
          )}
        </div>

        {/* Content or Edit input */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg p-2 text-xs focus:outline-none"
              style={{
                background: 'var(--color-input)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-text-primary)',
              }}
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                if (e.key === 'Escape') { setIsEditing(false); setEditContent(message.content); }
              }}
            />
            <div className="flex gap-2 text-[11px]">
              <button
                onClick={handleSaveEdit}
                className="rounded px-2.5 py-1 font-semibold text-white transition-colors"
                style={{ background: 'var(--color-accent)' }}
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(message.content); }}
                className="rounded px-2.5 py-1 transition-colors"
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
            className="mt-0.5 text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {renderContent(message.content)}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => {
              const isImg = att.type.startsWith('image/');
              return isImg ? (
                <div
                  key={att.id}
                  className="group/img relative overflow-hidden rounded-xl w-full max-w-md transition-all"
                  style={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    className="h-32 w-full flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                    }}
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="h-full w-full object-cover opacity-80 mix-blend-overlay"
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
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded p-1.5 transition-colors hover:bg-white/10"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
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
                  <button className="ml-2 rounded p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    <Download className="h-3.5 w-3.5" />
                  </button>
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
                  onClick={() => toggleReaction(message.id, emoji)}
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
                onClick={() => toggleReaction(message.id, emoji)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition-all hover:scale-110"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {[
            {
              icon: <Smile className="h-3.5 w-3.5" />,
              label: 'Add reaction',
              action: () => setShowEmojiPicker(!showEmojiPicker),
            },
            ...(!isThreadReply
              ? [{
                  icon: <MessageSquare className="h-3.5 w-3.5" />,
                  label: 'Reply in thread',
                  action: () => openThread(message.id),
                }]
              : []),
            {
              icon: <Pin className="h-3.5 w-3.5" />,
              label: message.pinned ? 'Unpin' : 'Pin message',
              action: () => togglePin(message.id),
              active: message.pinned,
            },
            {
              icon: <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />,
              label: isSaved ? 'Remove from saved' : 'Save for later',
              action: () => toggleSaveMessage(message.id),
              active: isSaved,
            },
            {
              icon: <MoreHorizontal className="h-3.5 w-3.5" />,
              label: 'More actions',
              action: () => setShowMoreActions(!showMoreActions),
            },
          ].map((btn, i) => (
            <Tooltip key={i} content={btn.label} side="top">
              <button
                onClick={btn.action}
                className="relative flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{
                  color: btn.active ? (btn.label.includes('Pin') ? 'var(--color-pin)' : 'var(--color-accent)') : 'var(--color-text-secondary)',
                  background: btn.active ? 'rgba(124,58,237,0.12)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!btn.active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!btn.active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                {btn.icon}
              </button>
            </Tooltip>
          ))}

          {/* More dropdown */}
          {showMoreActions && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMoreActions(false)} />
              <div
                className="absolute right-0 top-full mt-1 w-40 rounded-lg p-1 shadow-2xl z-40 animate-in fade-in zoom-in-95"
                style={{ background: 'var(--color-modal)', border: '1px solid var(--color-border)' }}
              >
                <button
                  onClick={() => { toggleSaveMessage(message.id); setShowMoreActions(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <Bookmark className={cn("h-3 w-3", isSaved && "fill-current text-violet-400")} />
                  <span>{isSaved ? 'Remove from saved' : 'Save message'}</span>
                </button>

                {/* Workflow Bridge Actions */}
                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={() => { openCreateTaskModal(message); setShowMoreActions(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors text-indigo-300 hover:bg-indigo-600/20"
                >
                  <CheckSquare className="h-3 w-3 text-indigo-400" />
                  <span>Create task</span>
                </button>

                <button
                  onClick={() => { openCreateApprovalModal(message); setShowMoreActions(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors text-sky-300 hover:bg-sky-600/20"
                >
                  <FileCheck2 className="h-3 w-3 text-sky-400" />
                  <span>Request approval</span>
                </button>

                <button
                  onClick={() => {
                    saveAsDecision(message.id);
                    setDecisionSaved(true);
                    setTimeout(() => setDecisionSaved(false), 1500);
                    setShowMoreActions(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors text-amber-300 hover:bg-amber-600/20"
                >
                  <Lightbulb className="h-3 w-3 text-amber-400" />
                  <span>{decisionSaved ? 'Decision Logged!' : 'Save as decision'}</span>
                </button>

                <button
                  onClick={() => { openThread(message.id); setShowMoreActions(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors text-violet-300 hover:bg-violet-600/20"
                >
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  <span>Summarize thread</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {copied ? <Check className="h-3 w-3" style={{ color: 'var(--color-online)' }} /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy text'}</span>
                </button>
                {isAuthor && (
                  <>
                    <button
                      onClick={() => { setIsEditing(true); setShowMoreActions(false); }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit message</span>
                    </button>
                    <button
                      onClick={() => { deleteMessage(message.id); setShowMoreActions(false); }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
                      style={{ color: 'var(--color-busy)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <Trash2 className="h-3 w-3" />
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
            className="absolute right-4 top-8 z-40 grid grid-cols-4 gap-1 rounded-xl p-2 shadow-2xl animate-in fade-in zoom-in-95"
            style={{ background: 'var(--color-modal)', border: '1px solid var(--color-border)' }}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { toggleReaction(message.id, emoji); setShowEmojiPicker(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:scale-110"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
