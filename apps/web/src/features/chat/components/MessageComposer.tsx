import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Indent,
  Code,
  LayoutGrid,
  Plus,
  Type,
  Smile,
  AtSign,
  Image,
  Mic,
  Slash,
  Send,
  X,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations } from '../../../hooks';
import { socketService } from '../../../services';
import { chatService } from '../../../services';
import { Tooltip } from '../../../components/ui';
import { MentionDropdown, MentionItem } from './MentionDropdown';

const EMOJI_LIST = ['😀', '🔥', '🚀', '🎉', '👍', '❤️', '🙌', '💡', '✨', '👀', '💯', '👏'];

export interface MessageComposerProps {
  parentMessageId?: string;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  parentMessageId,
  placeholder,
}) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; url: string; size: number; type: string }[]
  >([]);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { activeId, activeType } = useUiStore();
  const { channels, conversations, users, currentUser } = useWorkspace();
  const { sendMessage } = useChatMutations();

  const sendTypingIndicator = (isTyping: boolean) => {
    if (isTyping) {
      socketService.startTyping(
        currentUser.name,
        activeType === 'channel' ? activeId : undefined,
        activeType === 'conversation' ? activeId : undefined,
      );
    } else {
      socketService.stopTyping(
        activeType === 'channel' ? activeId : undefined,
        activeType === 'conversation' ? activeId : undefined,
      );
    }
  };

  const currentChannel = channels.find((c) => c.id === activeId);
  const currentConversation = conversations.find((c) => c.id === activeId);
  const otherUser =
    activeType === 'conversation' && currentConversation
      ? users.find(
          (u) =>
            u.id ===
            (currentConversation.participants.find((id) => id !== currentUser.id) ||
              currentConversation.participants[0]),
        )
      : null;

  const draftKey = `team_chat_draft_${parentMessageId ? `thread_${parentMessageId}` : `${activeType}_${activeId}`}`;

  // Restore draft when switching context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(draftKey) || '';
      setContent(saved);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        if (saved) {
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            }
          }, 0);
        }
      }
    }
  }, [draftKey]);

  // Persist draft to localStorage
  const handleContentChange = useCallback((newVal: string) => {
    setContent(newVal);
    if (typeof window !== 'undefined') {
      if (newVal.trim()) {
        localStorage.setItem(draftKey, newVal);
      } else {
        localStorage.removeItem(draftKey);
      }
    }

    // Check for @ mention trigger at cursor position
    const el = textareaRef.current;
    if (el) {
      const cursorPos = el.selectionStart;
      const textBeforeCursor = newVal.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

      if (atMatch) {
        setMentionQuery(atMatch[1]);
        setMentionStartIndex(cursorPos - atMatch[0].length);
      } else {
        setMentionQuery(null);
        setMentionStartIndex(-1);
      }
    }
  }, [draftKey]);

  const placeholderText =
    placeholder ||
    (parentMessageId
      ? 'Reply in thread...'
      : activeType === 'channel' && currentChannel
      ? `Message #${currentChannel.name}`
      : otherUser
      ? `Message ${otherUser.name}`
      : 'Type a message...');

  const canSend = content.trim().length > 0 || attachedFiles.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingIndicator(false);

    sendMessage.mutate({
      content,
      attachments: attachedFiles,
      parentMessageId,
    });

    setContent('');
    setAttachedFiles([]);
    setMentionQuery(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(draftKey);
    }
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If mention dropdown is open, let its global listener handle navigation
    if (mentionQuery !== null && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectMention = (item: MentionItem) => {
    if (mentionStartIndex < 0 || !textareaRef.current) return;

    const el = textareaRef.current;
    const cursorPos = el.selectionStart;
    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(cursorPos);
    const tag = `@${item.name} `;
    const updated = before + tag + after;

    setContent(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(draftKey, updated);
    }
    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      el.focus();
      const nextPos = before.length + tag.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const insertFormat = (before: string, after: string = before) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const next =
      content.slice(0, start) + before + (selected || 'text') + after + content.slice(end);
    handleContentChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + (selected.length || 4),
      );
    }, 0);
  };

  const fmtBtn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <Tooltip content={label} side="top">
      <button
        type="button"
        onClick={onClick}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-all"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-muted)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );

  const divider = (
    <div className="h-4 w-px mx-0.5" style={{ background: 'var(--color-border)' }} />
  );

  return (
    <div className="px-4 pb-4 pt-2 shrink-0 relative">
      {/* Scoped Mention Autocomplete Popover */}
      {mentionQuery !== null && (
        <MentionDropdown
          query={mentionQuery}
          channelId={activeType === 'channel' ? activeId : undefined}
          conversationId={activeType === 'conversation' ? activeId : undefined}
          onSelect={handleSelectMention}
          onClose={() => setMentionQuery(null)}
        />
      )}

      <div
        className="overflow-hidden rounded-xl transition-all"
        style={{
          background: 'var(--color-input)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* TOP: Formatting toolbar */}
        <div
          className="flex items-center gap-0.5 px-2 py-1.5"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          {fmtBtn(<Bold className="h-4 w-4" />, 'Bold', () => insertFormat('**'))}
          {fmtBtn(<Italic className="h-4 w-4" />, 'Italic', () => insertFormat('_'))}
          {fmtBtn(<Underline className="h-4 w-4" />, 'Underline', () => insertFormat('<u>', '</u>'))}
          {fmtBtn(<Strikethrough className="h-4 w-4" />, 'Strikethrough', () => insertFormat('~~'))}
          {divider}
          {fmtBtn(<LinkIcon className="h-4 w-4" />, 'Add link', () => insertFormat('[', '](url)'))}
          {divider}
          {fmtBtn(<ListOrdered className="h-4 w-4" />, 'Numbered list', () => insertFormat('\n1. '))}
          {fmtBtn(<List className="h-4 w-4" />, 'Bulleted list', () => insertFormat('\n- '))}
          {fmtBtn(<Indent className="h-4 w-4" />, 'Indent', () => insertFormat('\n  '))}
          {divider}
          {fmtBtn(<Code className="h-4 w-4" />, 'Code block', () => insertFormat('```\n', '\n```'))}
          {fmtBtn(<LayoutGrid className="h-4 w-4" />, 'Table', () => insertFormat('\n| Col1 | Col2 |\n|---|---|\n| ', ' | |\n'))}
        </div>

        {/* File attachment chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {attachedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs"
                style={{
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <FileText className="h-3 w-3" style={{ color: 'var(--color-accent)' }} />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <button
                  onClick={() => setAttachedFiles((p) => p.filter((_, j) => j !== i))}
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          placeholder={placeholderText}
          rows={2}
          onChange={(e) => {
            const val = e.target.value;
            handleContentChange(val);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

            if (val.trim()) {
              sendTypingIndicator(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                sendTypingIndicator(false);
              }, 2000);
            } else {
              sendTypingIndicator(false);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-sm focus:outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />

        {/* BOTTOM: Actions toolbar */}
        <div
          className="flex items-center justify-between px-2 py-1.5"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          {/* Left icons */}
          <div className="flex items-center gap-0.5">
            {fmtBtn(
              <Plus className="h-4 w-4" />,
              'Attach files',
              () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = async () => {
                  const files = Array.from(input.files || []);
                  for (const file of files) {
                    try {
                      const uploaded = await chatService.uploadAttachment(file);
                      setAttachedFiles((p) => [...p, uploaded]);
                    } catch {
                      useUiStore.getState().setError('Failed to upload file');
                    }
                  }
                };
                input.click();
              },
            )}
            {fmtBtn(<Type className="h-4 w-4" />, 'Text formatting', () => {})}

            {/* Emoji */}
            <div className="relative">
              {fmtBtn(<Smile className="h-4 w-4" />, 'Emoji', () => setShowEmoji(!showEmoji))}
              {showEmoji && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowEmoji(false)} />
                  <div
                    className="absolute bottom-full left-0 mb-2 grid grid-cols-6 gap-1 p-2.5 rounded-xl shadow-2xl z-40 animate-in zoom-in-95"
                    style={{
                      background: 'var(--color-modal)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {EMOJI_LIST.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          handleContentChange(content + em);
                          setShowEmoji(false);
                          textareaRef.current?.focus();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:scale-110 hover:bg-white/10"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {fmtBtn(<AtSign className="h-4 w-4" />, 'Mention', () => {
              handleContentChange(content + '@');
              textareaRef.current?.focus();
            })}
            {fmtBtn(<Image className="h-4 w-4" />, 'Add image', () => {})}
            {fmtBtn(<Mic className="h-4 w-4" />, 'Voice message', () => {})}
            {fmtBtn(<Slash className="h-4 w-4" />, 'Slash commands', () => {
              handleContentChange(content + '/');
              textareaRef.current?.focus();
            })}
          </div>

          {/* Right: Send button — violet gradient with dropdown split */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleSend}
              className="flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
              style={{
                background: canSend
                  ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))'
                  : 'var(--color-elevated)',
                color: canSend ? '#fff' : 'var(--color-text-tertiary)',
                boxShadow: canSend ? '0 0 14px rgba(124,58,237,0.35)' : 'none',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                cursor: canSend ? 'pointer' : 'default',
              }}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </button>
            <button
              type="button"
              className="flex h-full items-center justify-center rounded-r-lg px-1.5 transition-all"
              style={{
                background: canSend
                  ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))'
                  : 'var(--color-elevated)',
                color: canSend ? '#fff' : 'var(--color-text-tertiary)',
                boxShadow: canSend ? '0 0 14px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
