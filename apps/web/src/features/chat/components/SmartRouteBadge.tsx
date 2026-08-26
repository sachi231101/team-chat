import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, User, CheckSquare, Hash, Bot, X } from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace } from '../../../hooks';
import { chatService } from '../../../services';
import { SmartRouteSuggestion } from '@team-chat/shared';

interface SmartRouteBadgeProps {
  draftText: string;
  onInsertText: (text: string) => void;
}

export const SmartRouteBadge: React.FC<SmartRouteBadgeProps> = ({ draftText, onInsertText }) => {
  const { activeId, activeType, setActiveChannel, openCreateActionForMessage } = useUiStore();
  const { channels } = useWorkspace();

  const [suggestion, setSuggestion] = useState<SmartRouteSuggestion | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setDismissed(false);
    if (!draftText || draftText.trim().length < 15) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const res = await chatService.smartRouteWithAi({
          text: draftText,
          currentChannelId: activeType === 'channel' ? activeId : undefined,
        });
        if (res && res.confidence > 0.5) {
          setSuggestion(res);
        } else {
          setSuggestion(null);
        }
      } catch {
        setSuggestion(null);
      } finally {
        setAnalyzing(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [draftText, activeId, activeType]);

  if (!suggestion || dismissed) return null;

  const isCurrentChannel =
    activeType === 'channel' && suggestion.suggestedChannelId === activeId;

  return (
    <div className="mb-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-gradient-to-r from-violet-950/60 via-stone-900 to-indigo-950/60 border border-violet-500/30 shadow-md text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-violet-300">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span>Smart Route:</span>
        </span>

        {/* Suggested Channel */}
        {suggestion.suggestedChannelId && !isCurrentChannel && (
          <button
            type="button"
            onClick={() => {
              if (suggestion.suggestedChannelId) {
                setActiveChannel(suggestion.suggestedChannelId);
              }
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
            title={`Switch to ${suggestion.suggestedChannelName}`}
          >
            <Hash className="w-3 h-3" />
            <span>Post to {suggestion.suggestedChannelName}</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}

        {/* Suggested User to Tag */}
        {suggestion.suggestedUserName && (
          <button
            type="button"
            onClick={() => onInsertText(`${suggestion.suggestedUserName} `)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
            title="Mention teammate"
          >
            <User className="w-3 h-3" />
            <span>Tag {suggestion.suggestedUserName}</span>
          </button>
        )}

        {/* Suggested Agent to Tag */}
        {suggestion.suggestedAgentName && (
          <button
            type="button"
            onClick={() => onInsertText(`${suggestion.suggestedAgentName} `)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
            title="Mention AI agent"
          >
            <Bot className="w-3 h-3" />
            <span>Ask {suggestion.suggestedAgentName}</span>
          </button>
        )}

        {/* Reason pill */}
        {suggestion.reason && (
          <span className="text-[10px] text-stone-400 truncate max-w-xs hidden sm:inline">
            • {suggestion.reason}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
