import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Loader2, Bot } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useResizablePanel } from '../../../hooks';
import { chatService, socketService } from '../../../services';
import { Tooltip } from '../../../components/ui';
import { ResizeHandle } from '../../../components/common';
import { renderChatMarkdown } from '../lib/renderChatMarkdown';

/**
 * Slack-like WorkspaceAgent side panel: a normal DM with the bot.
 * Extra product tabs (Memory / Swarm / Skills / …) live elsewhere or were removed.
 */
export const AiBotPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { aiPanelOpen, setAiPanelOpen, typingUsers } = useUiStore();
  const { conversations, currentUser } = useWorkspace();

  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const botConversation = useMemo(() => {
    return conversations.find(
      (c) =>
        c.participants.includes('usr-agent-workspace') &&
        c.participants.includes(currentUser.id),
    );
  }, [conversations, currentUser.id]);

  const createConvoMutation = useMutation({
    mutationFn: () =>
      chatService.createConversation([currentUser.id, 'usr-agent-workspace']),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (!aiPanelOpen) createConvoMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiPanelOpen]);

  useEffect(() => {
    if (aiPanelOpen && !botConversation && createConvoMutation.status === 'idle') {
      createConvoMutation.mutate();
    }
  }, [aiPanelOpen, botConversation, createConvoMutation.status, createConvoMutation.mutate]);

  const botConvoId = botConversation?.id;

  useEffect(() => {
    if (aiPanelOpen && botConvoId) {
      socketService.joinConversation(botConvoId);
    }
  }, [aiPanelOpen, botConvoId]);

  const messagesQuery = useQuery({
    queryKey: ['messages', 'conversation', botConvoId],
    queryFn: () => chatService.getMessages(undefined, botConvoId, 50),
    enabled: Boolean(botConvoId && aiPanelOpen),
    refetchInterval: isSubmitting ? 1000 : false,
  });

  const realMessages = messagesQuery.data?.items ?? [];

  const isBotTyping = typingUsers.some(
    (u) => u.userId === 'usr-agent-workspace' || u.conversationId === botConvoId,
  );

  useEffect(() => {
    if (aiPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [realMessages.length, isBotTyping, aiPanelOpen]);

  const { width, isDragging, handleProps } = useResizablePanel({
    storageKey: 'team_chat_ai_panel_width',
    defaultWidth: 400,
    minWidth: 320,
    maxWidth: 640,
    direction: 'left',
  });

  if (!aiPanelOpen) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    setInput('');

    try {
      let targetConvoId = botConvoId;
      if (!targetConvoId) {
        const created = await chatService.createConversation([
          currentUser.id,
          'usr-agent-workspace',
        ]);
        targetConvoId = created.id;
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }

      await chatService.sendMessage({
        content: text,
        conversationId: targetConvoId,
      });

      void queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', targetConvoId],
      });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      useUiStore
        .getState()
        .setError(err instanceof Error ? err.message : 'Failed to message WorkspaceAgent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <aside
      className="relative z-30 flex h-full shrink-0 flex-col animate-in slide-in-right"
      style={{
        width: `${width}px`,
        background: 'var(--color-right-panel)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      <ResizeHandle
        direction="left"
        isDragging={isDragging}
        onMouseDown={handleProps.onMouseDown}
      />

      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-accent)' }}
          >
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                WorkspaceAgent
              </h3>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--color-online)' }}>
                App
              </span>
            </div>
            <p className="truncate text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Direct message · replies via AI when enabled
            </p>
          </div>
        </div>
        <Tooltip content="Close" side="bottom">
          <button
            type="button"
            onClick={() => setAiPanelOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {realMessages.length === 0 && !messagesQuery.isLoading && (
          <div
            className="rounded-xl p-3.5 text-[13px] leading-relaxed"
            style={{
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p className="mb-1 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Hi — I&apos;m WorkspaceAgent
            </p>
            <p>
              Ask about channels you can access, catch up on unread, or draft a reply. Same as DMing
              me from the sidebar.
            </p>
          </div>
        )}

        {messagesQuery.isLoading && (
          <div className="flex justify-center py-8" style={{ color: 'var(--color-text-tertiary)' }}>
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {realMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[90%] rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed"
                style={{
                  background: isMe ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {!isMe && (
                  <p className="mb-1 text-[11px] font-bold" style={{ color: 'var(--color-accent)' }}>
                    WorkspaceAgent
                  </p>
                )}
                <div className="prose-chat">{renderChatMarkdown(msg.content)}</div>
              </div>
            </div>
          );
        })}

        {(isBotTyping || isSubmitting) && (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            WorkspaceAgent is typing…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="shrink-0 p-3"
        style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-elevated)' }}
      >
        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'var(--color-input)', borderColor: 'var(--color-border)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Message WorkspaceAgent"
            className="w-full resize-none bg-transparent p-3 text-[14px] leading-relaxed outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderTop: '1px solid var(--color-border-subtle)' }}
          >
            <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Enter to send
            </span>
            <button
              type="button"
              disabled={!input.trim() || isSubmitting}
              onClick={() => void handleSend()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-30"
              style={{ background: 'var(--color-accent)' }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
