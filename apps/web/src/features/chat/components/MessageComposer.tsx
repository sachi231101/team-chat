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
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useChatMutations, useActiveMessages } from '../../../hooks';
import { socketService } from '../../../services';

import { chatService } from '../../../services';
import { Tooltip } from '../../../components/ui';
import { MentionDropdown, MentionItem } from './MentionDropdown';
import { SlashCommandDropdown, SlashCommandItem } from './SlashCommandDropdown';
import { ChannelDropdown } from './ChannelDropdown';
import { SmartRouteBadge } from './SmartRouteBadge';
import { CreatePollModal } from './CreatePollModal';
import { Channel } from '@team-chat/shared';

import {
  getPlainText,
  getTextBeforeCaret,
  htmlToMarkdown,
  markdownToHtml,
  isEditorEmpty,
} from '../lib/composerHtml';

const EMOJI_LIST = ['😀', '🔥', '🚀', '🎉', '👍', '❤️', '🙌', '💡', '✨', '👀', '💯', '👏'];

const AI_COMPOSE_ACTIONS: { id: 'improve' | 'shorten' | 'expand' | 'translate' | 'summarize' | 'casual' | 'exec'; label: string }[] = [
  { id: 'improve', label: 'Improve writing' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'expand', label: 'Expand' },
  { id: 'casual', label: 'Casual tone' },
  { id: 'exec', label: 'Exec tone' },
  { id: 'translate', label: 'Translate / polish' },
  { id: 'summarize', label: 'Summarize' },
];

export interface MessageComposerProps {
  parentMessageId?: string;
  placeholder?: string;
}

type Marks = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
};

export const MessageComposer: React.FC<MessageComposerProps> = ({
  parentMessageId,
  placeholder,
}) => {
  const [plain, setPlain] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; url: string; size: number; type: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [marks, setMarks] = useState<Marks>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [channelQuery, setChannelQuery] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);

  const pickFiles = (accept: string) => {

    const input = fileInputRef.current;
    if (!input) return;
    input.accept = accept;
    input.click();
  };

  const { activeId, activeType, setEditingMessageId } = useUiStore();
  const { channels, conversations, users, currentUser } = useWorkspace();
  const { messages } = useActiveMessages();
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

  const persistDraft = (markdown: string) => {
    if (typeof window === 'undefined') return;
    if (markdown.trim()) localStorage.setItem(draftKey, markdown);
    else localStorage.removeItem(draftKey);
  };

  const refreshMarks = () => {
    try {
      setMarks({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
      });
    } catch {
      /* ignore */
    }
  };

  const syncFromEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = getPlainText(el);
    setPlain(text);
    persistDraft(htmlToMarkdown(el.innerHTML));
    refreshMarks();

    const before = getTextBeforeCaret(el);

    // 1. @ for users
    const atMatch = before.match(/@([a-zA-Z0-9_-]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setChannelQuery(null);
      setSlashQuery(null);
    } else {
      setMentionQuery(null);

      // 2. # for channels
      const hashMatch = before.match(/#([a-zA-Z0-9_-]*)$/);
      if (hashMatch) {
        setChannelQuery(hashMatch[1]);
        setSlashQuery(null);
      } else {
        setChannelQuery(null);

        // 3. / for agents and slash commands (at start of line or after whitespace)
        const slashMatch = before.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
        if (slashMatch) {
          setSlashQuery(slashMatch[1]);
        } else {
          setSlashQuery(null);
        }
      }
    }

    if (text.trim()) {
      sendTypingIndicator(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 2000);
    } else {
      sendTypingIndicator(false);
    }
  }, [draftKey, currentUser.name, activeId, activeType]);

  const setEditorHtml = (html: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = html || '';
    syncFromEditor();
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [activeId, activeType, parentMessageId]);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(draftKey) || '' : '';
    setPlain(raw);
    if (editorRef.current) {
      editorRef.current.innerHTML = raw ? markdownToHtml(raw) : '';
    }
    setAttachedFiles([]);
    setMentionQuery(null);
    setChannelQuery(null);
    setSlashQuery(null);
    setShowEmojiPicker(false);
    setShowAiAssist(false);
  }, [draftKey]);

  const isSelf =
    activeType === 'conversation' &&
    currentConversation &&
    (currentConversation.participants.every((id) => id === currentUser.id) ||
      otherUser?.id === currentUser.id);

  const placeholderText =
    placeholder ||
    (parentMessageId
      ? 'Reply in thread...'
      : activeType === 'channel' && currentChannel
      ? `Message #${currentChannel.name}`
      : isSelf
      ? 'Jot something down'
      : otherUser
      ? `Message ${otherUser.name}`
      : 'Type a message...');

  const canSend = (plain.trim().length > 0 || attachedFiles.length > 0) && !isUploading;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await chatService.uploadAttachment(file);
        setAttachedFiles((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      useUiStore.getState().setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncFromEditor();
  };

  const handleAiCompose = async (action: (typeof AI_COMPOSE_ACTIONS)[number]['id']) => {
    const draft = htmlToMarkdown(editorRef.current?.innerHTML || plain).trim();
    if (!draft) {
      useUiStore.getState().setError('Type a message first, then use AI assist.');
      return;
    }
    setIsAiRewriting(true);
    setShowAiAssist(false);
    try {
      const result = await chatService.composeWithAi({
        action,
        text: draft,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
        parentMessageId,
      });
      if (result.text) {
        setEditorHtml(markdownToHtml(result.text));
        editorRef.current?.focus();
      }
    } catch (err) {
      useUiStore.getState().setError(err instanceof Error ? err.message : 'AI assist is unavailable');
    } finally {
      setIsAiRewriting(false);
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingIndicator(false);

    const markdown = htmlToMarkdown(editorRef.current?.innerHTML || '').trim() || plain.trim();
    sendMessage.mutate({
      content: markdown,
      attachments: attachedFiles,
      parentMessageId,
    });

    setAttachedFiles([]);
    setMentionQuery(null);
    setPlain('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    if (typeof window !== 'undefined') localStorage.removeItem(draftKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionQuery !== null && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
      return;
    }

    if (
      e.key === 'ArrowUp' &&
      isEditorEmpty(editorRef.current) &&
      attachedFiles.length === 0 &&
      mentionQuery === null &&
      channelQuery === null &&
      slashQuery === null
    ) {
      e.preventDefault();
      const myLatest = [...messages].reverse().find(
        (m) =>
          m.senderId === currentUser.id &&
          (parentMessageId ? m.parentMessageId === parentMessageId : !m.parentMessageId) &&
          !m.deliveryStatus,
      );
      if (myLatest) {
        setEditingMessageId(myLatest.id);
      }
      return;
    }

    if (e.key === 'Escape') {
      setMentionQuery(null);
      setChannelQuery(null);
      setSlashQuery(null);
      setShowEmojiPicker(false);
      setShowAiAssist(false);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      exec('bold');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      exec('italic');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      exec('underline');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectMention = (item: MentionItem) => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    el.focus();
    const before = getTextBeforeCaret(el);
    const match = before.match(/@([a-zA-Z0-9_-]*)$/);
    const range = sel.getRangeAt(0);
    if (match && range.startContainer.nodeType === Node.TEXT_NODE) {
      const node = range.startContainer;
      const end = range.startOffset;
      const start = Math.max(0, end - match[0].length);
      range.setStart(node, start);
      range.deleteContents();
    }
    document.execCommand('insertText', false, `@${item.name} `);
    setMentionQuery(null);
    syncFromEditor();
  };

  const handleSelectChannel = (channel: Channel) => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    el.focus();
    const before = getTextBeforeCaret(el);
    const match = before.match(/#([a-zA-Z0-9_-]*)$/);
    const range = sel.getRangeAt(0);
    if (match && range.startContainer.nodeType === Node.TEXT_NODE) {
      const node = range.startContainer;
      const end = range.startOffset;
      const start = Math.max(0, end - match[0].length);
      range.setStart(node, start);
      range.deleteContents();
    }
    document.execCommand('insertText', false, `#${channel.name} `);
    setChannelQuery(null);
    syncFromEditor();
  };

  const handleSelectSlashCommand = (item: SlashCommandItem) => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    el.focus();
    const before = getTextBeforeCaret(el);
    const match = before.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    const range = sel.getRangeAt(0);
    if (match && range.startContainer.nodeType === Node.TEXT_NODE) {
      const node = range.startContainer;
      const end = range.startOffset;
      const matchText = match[0].trimStart();
      const start = Math.max(0, end - matchText.length);
      range.setStart(node, start);
      range.deleteContents();
    }
    if (item.id === 'cmd-poll') {
      setSlashQuery(null);
      syncFromEditor();
      setPollModalOpen(true);
      return;
    }
    document.execCommand('insertText', false, `${item.command} `);
    setSlashQuery(null);
    syncFromEditor();
  };


  const insertPlain = (value: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, value);
    syncFromEditor();
  };

  const fmtBtn = (icon: React.ReactNode, label: string, onClick: () => void, active?: boolean) => (
    <Tooltip content={label} side="top">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-all"
        style={{
          color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          background: active ? 'var(--color-accent-muted)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (active) return;
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-muted)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          if (active) return;
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

  const empty = isEditorEmpty(editorRef.current) && !plain.trim();

  return (
    <div className="px-4 pb-4 pt-2 shrink-0 relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => void handleFilesSelected(e.target.files)}
      />
      {mentionQuery !== null && (
        <MentionDropdown
          query={mentionQuery}
          channelId={activeType === 'channel' ? activeId : undefined}
          conversationId={activeType === 'conversation' ? activeId : undefined}
          onSelect={handleSelectMention}
          onClose={() => setMentionQuery(null)}
        />
      )}
      {channelQuery !== null && (
        <ChannelDropdown
          query={channelQuery}
          onSelect={handleSelectChannel}
          onClose={() => setChannelQuery(null)}
        />
      )}
      {slashQuery !== null && (
        <SlashCommandDropdown
          query={slashQuery}
          onSelect={handleSelectSlashCommand}
          onClose={() => setSlashQuery(null)}
        />
      )}

      <SmartRouteBadge draftText={plain} onInsertText={(t) => insertPlain(t)} />

      <div
        className="overflow-hidden rounded-xl transition-all"
        style={{
          background: 'var(--color-input)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="flex items-center gap-0.5 px-2 py-1.5"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          {fmtBtn(<Bold className="h-4 w-4" />, 'Bold', () => exec('bold'), marks.bold)}
          {fmtBtn(<Italic className="h-4 w-4" />, 'Italic', () => exec('italic'), marks.italic)}
          {fmtBtn(<Underline className="h-4 w-4" />, 'Underline', () => exec('underline'), marks.underline)}
          {fmtBtn(
            <Strikethrough className="h-4 w-4" />,
            'Strikethrough',
            () => exec('strikeThrough'),
            marks.strike,
          )}
          {divider}
          {fmtBtn(<LinkIcon className="h-4 w-4" />, 'Add link', () => {
            const url = window.prompt('Link URL', 'https://');
            if (!url) return;
            exec('createLink', url);
          })}
          {divider}
          {fmtBtn(<ListOrdered className="h-4 w-4" />, 'Numbered list', () => exec('insertOrderedList'))}
          {fmtBtn(<List className="h-4 w-4" />, 'Bulleted list', () => exec('insertUnorderedList'))}
          {fmtBtn(<Indent className="h-4 w-4" />, 'Indent', () => exec('indent'))}
          {divider}
          {fmtBtn(<Code className="h-4 w-4" />, 'Code', () => exec('formatBlock', 'pre'))}
          {fmtBtn(<LayoutGrid className="h-4 w-4" />, 'Table', () => {
            editorRef.current?.focus();
            document.execCommand(
              'insertHTML',
              false,
              '<table style="width:100%;border-collapse:collapse"><tr><td style="border:1px solid currentColor;padding:4px"> </td><td style="border:1px solid currentColor;padding:4px"> </td></tr></table>',
            );
            syncFromEditor();
          })}
        </div>

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

        <div className="relative">
          {empty && (
            <div
              className="pointer-events-none absolute left-3 top-2.5 text-[15px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {placeholderText}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label={placeholderText}
            suppressContentEditableWarning
            onInput={syncFromEditor}
            onKeyUp={refreshMarks}
            onMouseUp={refreshMarks}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text/plain');
              document.execCommand('insertText', false, text);
              syncFromEditor();
            }}
            className="composer-editor w-full min-h-[56px] max-h-[220px] overflow-y-auto bg-transparent px-3 py-2.5 text-[15px] leading-relaxed focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        <div
          className="relative flex items-center justify-between px-2 py-1.5"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-0.5">
            {fmtBtn(
              <Plus className="h-4 w-4" />,
              'Attach files',
              () => pickFiles('image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip'),
            )}
            {fmtBtn(<Type className="h-4 w-4" />, 'Text formatting', () => editorRef.current?.focus())}
            {fmtBtn(<Smile className="h-4 w-4" />, 'Emoji', () => setShowEmoji(!showEmoji))}
            {fmtBtn(<AtSign className="h-4 w-4" />, 'Mention', () => insertPlain('@'))}
            <div className="relative">
              {fmtBtn(
                <Sparkles className="h-4 w-4" />,
                isAiRewriting ? 'Rewriting…' : 'AI assist',
                () => setShowAiAssist((open) => !open),
              )}
              {showAiAssist && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowAiAssist(false)} />
                  <div
                    className="absolute bottom-full left-0 mb-2 w-48 rounded-xl p-1.5 shadow-2xl z-40 animate-in zoom-in-95"
                    style={{
                      background: 'var(--color-modal)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {AI_COMPOSE_ACTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isAiRewriting}
                        onClick={() => void handleAiCompose(item.id)}
                        className="flex w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-white/10"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {fmtBtn(<Image className="h-4 w-4" />, 'Add image', () => pickFiles('image/*'))}
            {fmtBtn(<Mic className="h-4 w-4" />, 'Add audio', () => pickFiles('audio/*'))}
            {fmtBtn(<BarChart2 className="h-4 w-4" />, 'Create poll', () => setPollModalOpen(true))}
            {fmtBtn(<Slash className="h-4 w-4" />, 'Slash commands', () => insertPlain('/'))}
          </div>


          {showEmoji && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowEmoji(false)} />
              <div
                className="absolute bottom-full right-2 z-40 mb-2 w-[13.75rem] shrink-0 rounded-xl p-2 shadow-2xl animate-in zoom-in-95"
                style={{
                  background: 'var(--color-modal)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="grid grid-cols-6 gap-0.5">
                  {EMOJI_LIST.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        insertPlain(em);
                        setShowEmoji(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl leading-none transition-all hover:scale-110 hover-surface-strong"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
            style={{
              background: canSend
                ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))'
                : 'var(--color-elevated)',
              color: canSend ? '#fff' : 'var(--color-text-tertiary)',
              boxShadow: canSend ? '0 0 14px rgba(124,58,237,0.35)' : 'none',
              cursor: canSend ? 'pointer' : 'default',
            }}
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isUploading ? 'Uploading…' : isAiRewriting ? 'AI…' : 'Send'}</span>
          </button>
        </div>
      </div>

      <CreatePollModal isOpen={pollModalOpen} onClose={() => setPollModalOpen(false)} />

      <style>{`
        .composer-editor strong, .composer-editor b { font-weight: 700; color: var(--color-text-primary); }
        .composer-editor em, .composer-editor i { font-style: italic; }
        .composer-editor u { text-decoration: underline; }
        .composer-editor s, .composer-editor strike { text-decoration: line-through; opacity: 0.85; }
        .composer-editor a { color: var(--color-accent); text-decoration: underline; }
        .composer-editor ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
        .composer-editor ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
        .composer-editor pre, .composer-editor code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          background: var(--color-code-bg, rgba(0,0,0,0.25));
          border-radius: 6px;
          padding: 2px 6px;
        }
      `}</style>
    </div>
  );
};

