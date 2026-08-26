import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Sparkles,
  Search,
  Send,
  Loader2,
  Bot,
  Zap,
  BookOpen,
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  Pin,
  Bookmark,
  Users,
  Lightbulb,
  Shield,
  Check,
  ArrowUpRight,
  Play,
  RotateCcw,
  Hash,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import {
  useWorkspace,
  useContextPinnedMessagesQuery,
  useSavedMessagesQuery,
  useResizablePanel,
} from '../../../hooks';
import { chatService, socketService } from '../../../services';
import { Tooltip, Avatar } from '../../../components/ui';
import { ResizeHandle } from '../../../components/common';
import { renderChatMarkdown } from '../lib/renderChatMarkdown';
import { Message, AiTeammateInfo, AiLearningRule } from '@team-chat/shared';

type AiPanelTab = 'messages' | 'memory' | 'multi-agent' | 'teammates' | 'skills' | 'rules';

export const AiBotPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [aiPanelTab, setAiPanelTab] = useState<AiPanelTab>('messages');
  const {
    aiPanelOpen,
    setAiPanelOpen,
    setActiveChannel,
    setCreateChannelModalOpen,
    openThread,
    jumpToMessage,
    typingUsers,
    setMultiAgentStudioOpen,
    setDailyBriefingOpen,
    setAiLearningModalOpen,
    setExtractWorkModalOpen,
    openExtractWorkForTarget,
    activeId,
    activeType,
  } = useUiStore();

  const { channels, conversations, currentUser } = useWorkspace();
  const pinnedQuery = useContextPinnedMessagesQuery();
  const savedQuery = useSavedMessagesQuery();

  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Company Memory State ──────────────────────────────────────
  const [memoryQuery, setMemoryQuery] = useState('');
  const [memoryResult, setMemoryResult] = useState<{
    answer: string;
    citations: Array<{
      index: number;
      messageId: string;
      senderName: string;
      content: string;
      channelId?: string;
      channelName?: string;
      conversationId?: string;
      createdAt: string;
    }>;
  } | null>(null);
  const [isMemorySearching, setIsMemorySearching] = useState(false);

  // 1. Find or create real persistent conversation with usr-agent-workspace
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
    if (aiPanelOpen && !botConversation && !createConvoMutation.isPending) {
      createConvoMutation.mutate();
    }
  }, [aiPanelOpen, botConversation, createConvoMutation]);

  // 2. Fetch real messages from database
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
    refetchInterval: isSubmitting ? 1000 : 5000,
  });

  const realMessages = useMemo(() => {
    return messagesQuery.data?.items ?? [];
  }, [messagesQuery.data]);

  const isBotTyping = typingUsers.some(
    (u) =>
      u.userId === 'usr-agent-workspace' ||
      u.userName?.includes('Workspace') ||
      u.userName?.includes('Agent'),
  );

  // 3. AI Teammates Query
  const teammatesQuery = useQuery({
    queryKey: ['aiTeammates'],
    queryFn: () => chatService.getAiTeammates(),
    enabled: aiPanelOpen && aiPanelTab === 'teammates',
  });

  // 4. AI Rules Query
  const rulesQuery = useQuery({
    queryKey: ['aiRules'],
    queryFn: () => chatService.getAiRules(),
    enabled: aiPanelOpen && aiPanelTab === 'rules',
  });

  const executeTaskMutation = useMutation({
    mutationFn: (actionItemId: string) => chatService.executeAgentTask(actionItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['actionItems'] });
      void queryClient.invalidateQueries({ queryKey: ['aiTeammates'] });
    },
  });

  useEffect(() => {
    if (aiPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [realMessages, isBotTyping, aiPanelOpen]);

  if (!aiPanelOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    if (!customPrompt) setInput('');

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
        .setError(
          err instanceof Error ? err.message : 'Failed to send message to AI',
        );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchCompanyMemory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memoryQuery.trim() || isMemorySearching) return;

    setIsMemorySearching(true);
    try {
      const res = await chatService.askAi({
        question: memoryQuery.trim(),
        channelId: activeType === 'channel' ? activeId : undefined,
      });
      setMemoryResult(res);
    } catch (err) {
      console.error('Failed to query company memory:', err);
    } finally {
      setIsMemorySearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const { width, isDragging, handleProps } = useResizablePanel({
    storageKey: 'team_chat_ai_panel_width',
    defaultWidth: 440,
    minWidth: 340,
    maxWidth: 820,
    direction: 'left',
  });

  const pinnedItems = pinnedQuery.data ?? [];
  const savedItems = savedQuery.data ?? [];
  const teammates: AiTeammateInfo[] = teammatesQuery.data ?? [];
  const rules: AiLearningRule[] = rulesQuery.data ?? [];

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col z-30 animate-in slide-in-right"
      style={{
        width: `${width}px`,
        background: 'var(--color-right-panel)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.25)',
      }}
    >
      <ResizeHandle
        direction="left"
        isDragging={isDragging}
        onMouseDown={handleProps.onMouseDown}
      />
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div
        className="flex h-14 shrink-0 items-center justify-between px-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
            style={{
              background:
                'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
            }}
          >
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className="text-[15px] font-bold truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                AI Assistant
              </h3>
              <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold">
                Online
              </span>
            </div>
            <p className="text-xs truncate text-slate-400">
              WorkspaceAgent • Ask anything
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="Close panel" side="bottom">
            <button
              type="button"
              onClick={() => setAiPanelOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover-surface transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ─────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 border-b shrink-0 text-[12px] font-semibold overflow-x-auto"
        style={{
          borderColor: 'var(--color-border-subtle)',
          background: 'var(--color-elevated)',
        }}
      >
        {(
          [
            { id: 'messages', label: 'Chat', icon: <Bot className="h-3.5 w-3.5" /> },
            { id: 'memory', label: 'Memory', icon: <Search className="h-3.5 w-3.5 text-sky-400" /> },
            { id: 'multi-agent', label: 'Swarm', icon: <Users className="h-3.5 w-3.5 text-cyan-400" /> },
            { id: 'teammates', label: 'Teammates', icon: <Shield className="h-3.5 w-3.5 text-emerald-400" /> },
            { id: 'skills', label: 'Skills', icon: <Zap className="h-3.5 w-3.5 text-amber-400" /> },
            { id: 'rules', label: 'Learned', icon: <Lightbulb className="h-3.5 w-3.5 text-purple-400" /> },
          ] as const
        ).map((tab) => {
          const isActive = aiPanelTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAiPanelTab(tab.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md transition-all whitespace-nowrap text-xs"
              style={{
                background: isActive ? 'var(--color-accent-muted)' : 'transparent',
                color: isActive ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-4">
        {/* ── TAB 1: Chat (Personal Workspace Agent) ─────────────── */}
        {aiPanelTab === 'messages' && (
          <>
            {/* Real Workspace Welcome Card */}
            <div
              className="rounded-xl p-3.5 text-[13.5px] leading-relaxed border space-y-3"
              style={{
                background: 'var(--color-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                <span className="font-bold text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
                  Workspace AI Assistant
                </span>
              </div>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                I am your workspace assistant. Ask questions across your chat history, catch up on channels, or draft announcements.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDailyBriefingOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Daily Briefing</span>
                </button>
                <button
                  type="button"
                  onClick={() => openExtractWorkForTarget({ channelId: activeId })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Extract Work</span>
                </button>
              </div>
            </div>

            {/* Real Persistent Message History */}
            {realMessages.map((msg: Message) => {
              const isUser = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className="space-y-2">
                  {!isUser ? (
                    <div className="flex items-start gap-2.5">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
                        }}
                      >
                        <Bot className="h-4 w-4 text-white" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {msg.senderName || 'AI Assistant'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className="rounded-xl p-3 text-[13.5px] leading-relaxed"
                          style={{
                            background: 'var(--color-elevated)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {renderChatMarkdown(msg.content)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 justify-end">
                      <div className="max-w-[85%] space-y-1 text-right">
                        <div className="flex items-baseline gap-2 justify-end">
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[13.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {currentUser.name}
                          </span>
                        </div>
                        <div
                          className="rounded-xl p-3 text-[13.5px] text-left leading-relaxed text-white shadow-sm inline-block"
                          style={{ background: 'var(--color-accent)' }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Real-time AI Typing Indicator */}
            {(isBotTyping || isSubmitting) && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span>WorkspaceAgent is thinking...</span>
              </div>
            )}

            {/* Quick Action Prompt Chips */}
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Suggested Prompts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What are the recent key decisions?',
                  'Summarize unread messages',
                  'What tasks are assigned to me?',
                  'Draft a project status update',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void handleSend(chip)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border hover-surface transition-all"
                    style={{
                      background: 'var(--color-elevated)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-violet-400" />
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </>
        )}

        {/* ── TAB 2: Company Memory (Search & Citations) ─────────── */}
        {aiPanelTab === 'memory' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-stone-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sky-300">
                <Search className="w-4 h-4 text-sky-400" />
                <span>Company Memory Search</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Answers questions using full team history with verified, clickable citation links to original messages.
              </p>
            </div>

            <form onSubmit={handleSearchCompanyMemory} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={memoryQuery}
                  onChange={(e) => setMemoryQuery(e.target.value)}
                  placeholder="Ask anything about past decisions, designs, or discussions..."
                  className="w-full rounded-xl pl-9 pr-12 py-2.5 text-xs bg-stone-900 text-stone-100 border border-stone-800 focus:outline-none focus:border-sky-500"
                />
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <button
                  type="submit"
                  disabled={!memoryQuery.trim() || isMemorySearching}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-30 transition-all"
                >
                  {isMemorySearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>

            {/* Memory Result with Citations */}
            {memoryResult && (
              <div className="p-4 rounded-xl border bg-stone-950/70 border-sky-500/30 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Synthesized Answer</span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {memoryResult.citations.length} sources cited
                  </span>
                </div>

                <div className="text-stone-200 leading-relaxed text-xs whitespace-pre-wrap font-sans">
                  {memoryResult.answer}
                </div>

                {/* Clickable Citations List */}
                {memoryResult.citations.length > 0 && (
                  <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-stone-400">Cited Messages (Click to Jump):</p>
                    <div className="space-y-1">
                      {memoryResult.citations.map((cit) => (
                        <button
                          key={cit.index}
                          type="button"
                          onClick={() =>
                            jumpToMessage({
                              messageId: cit.messageId,
                              channelId: cit.channelId,
                              conversationId: cit.conversationId,
                            })
                          }
                          className="w-full p-2 rounded-lg bg-stone-900/80 hover:bg-stone-900 border border-stone-800 text-left transition-all flex items-start justify-between gap-2 group"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sky-400">[{cit.index}]</span>
                              <span className="font-semibold text-stone-300 text-[11px]">@{cit.senderName}</span>
                              {cit.channelName && (
                                <span className="text-[10px] text-stone-500 font-mono">#{cit.channelName}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 truncate">&ldquo;{cit.content}&rdquo;</p>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Multi-Agent Swarm ───────────────────────────── */}
        {aiPanelTab === 'multi-agent' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-stone-900 to-violet-950/30 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Multi-Agent Swarm Coordination</span>
              </div>
              <p className="text-stone-300 leading-relaxed text-[11px]">
                Collaborate with multiple autonomous AI teammates (ResearchAgent + SupportAgent + MeetingAgent + Verifier) on high-level objectives.
              </p>
              <button
                type="button"
                onClick={() => setMultiAgentStudioOpen(true)}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open Multi-Agent Studio</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 4: AI Teammates & Tasks ────────────────────────── */}
        {aiPanelTab === 'teammates' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                AI Teammates Directory ({teammates.length})
              </p>
            </div>

            {teammatesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-stone-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span className="text-xs">Loading AI teammates...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {teammates.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3.5 rounded-xl border bg-stone-950/60 border-stone-800 hover:border-emerald-500/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={agent.name} src={agent.avatarUrl} size="sm" />
                        <div>
                          <h4 className="font-bold text-xs text-stone-200">@{agent.name}</h4>
                          <p className="text-[10px] text-stone-400">{agent.title}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {agent.activeTaskCount || 0} active {agent.activeTaskCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {agent.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[9px] font-medium bg-stone-900 text-stone-300 border border-stone-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: Skills ──────────────────────────────────────── */}
        {aiPanelTab === 'skills' && (
          <div className="space-y-3 text-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Workspace AI Capabilities
            </p>

            <div className="p-3 rounded-xl border bg-stone-950/60 border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Conversation-to-Work</span>
                </span>
                <button
                  type="button"
                  onClick={() => openExtractWorkForTarget({ channelId: activeId })}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300"
                >
                  Run
                </button>
              </div>
              <p className="text-[11px] text-stone-400">
                Extract tasks, deadlines, decisions, risks, and approvals from the current channel.
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-stone-950/60 border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personal Daily Briefing</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDailyBriefingOpen(true)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300"
                >
                  View
                </button>
              </div>
              <p className="text-[11px] text-stone-400">
                Generate an executive digest of decisions, blockers, assignments, and risks.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 6: Learned Rules ───────────────────────────────── */}
        {aiPanelTab === 'rules' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Learned Team Guidelines ({rules.length})
              </p>
              <button
                type="button"
                onClick={() => setAiLearningModalOpen(true)}
                className="text-xs text-violet-400 hover:underline font-semibold"
              >
                Manage
              </button>
            </div>

            {rulesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-stone-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span className="text-xs">Loading guidelines...</span>
              </div>
            ) : rules.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center italic">
                No custom guidelines yet. Edit AI proposals to teach the system.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border bg-stone-950/60 border-stone-800 space-y-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-violet-500/20 text-violet-300">
                      {r.category}
                    </span>
                    <p className="text-stone-200 text-xs font-medium">{r.rule}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Composer ─────────────────────────────────────── */}
      <div
        className="p-3 border-t shrink-0"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-elevated)',
        }}
      >
        <div
          className="relative rounded-xl border overflow-hidden transition-all focus-within:ring-1 focus-within:ring-violet-500"
          style={{
            background: 'var(--color-input)',
            borderColor: 'var(--color-border)',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask AI Assistant anything or type / for commands..."
            className="w-full resize-none bg-transparent p-3 text-[14px] outline-none leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          />

          <div
            className="flex items-center justify-between px-3 py-2 border-t"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-xs font-mono">↵ to send</span>
            </div>

            <button
              type="button"
              disabled={!input.trim() || isSubmitting}
              onClick={() => void handleSend()}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-all disabled:opacity-30"
              style={{
                background:
                  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
                color: '#fff',
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
