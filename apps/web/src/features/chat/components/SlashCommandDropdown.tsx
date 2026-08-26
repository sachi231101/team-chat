import React, { useState, useEffect, useMemo } from 'react';
import { Bot, Search, Headphones, ShieldAlert, Sparkles, FileText, Calendar, BarChart2 } from 'lucide-react';

export interface SlashCommandItem {
  id: string;
  command: string;
  name: string;
  description: string;
  category: 'agent' | 'catchup' | 'tool';
  icon: React.ReactNode;
  hint?: string;
}

export interface SlashCommandDropdownProps {
  query: string;
  onSelect: (item: SlashCommandItem) => void;
  onClose: () => void;
}

const COMMAND_DEFINITIONS: SlashCommandItem[] = [
  {
    id: 'cmd-poll',
    command: '/poll',
    name: 'Create Poll',
    description: 'Create an interactive live poll with single or multiple choices',
    category: 'tool',
    icon: <BarChart2 className="h-4 w-4 text-sky-400" />,
    hint: '/poll',
  },

  {
    id: 'cmd-research',
    command: '/research',
    name: 'ResearchAgent',
    description: 'Ask questions with workspace search & cited messages',
    category: 'agent',
    icon: <Search className="h-4 w-4 text-sky-400" />,
    hint: '/research <question>',
  },
  {
    id: 'cmd-meeting',
    command: '/meeting',
    name: 'MeetingAgent (Notes)',
    description: 'Turn this thread/chat into decisions, summary & action items',
    category: 'agent',
    icon: <Headphones className="h-4 w-4 text-emerald-400" />,
    hint: '/meeting',
  },
  {
    id: 'cmd-support',
    command: '/support',
    name: 'SupportAgent',
    description: 'Diagnose incident/support issues and recommend fixes',
    category: 'agent',
    icon: <ShieldAlert className="h-4 w-4 text-amber-400" />,
    hint: '/support <issue details>',
  },
  {
    id: 'cmd-workspace',
    command: '/workspace',
    name: 'WorkspaceAgent',
    description: 'Personal assistant to search, catch up, and draft replies',
    category: 'agent',
    icon: <Bot className="h-4 w-4 text-violet-400" />,
    hint: '/workspace <request>',
  },
  {
    id: 'cmd-summarize',
    command: '/summarize',
    name: 'Summarize Channel',
    description: 'Catch up on recent channel activity and key discussions',
    category: 'catchup',
    icon: <Sparkles className="h-4 w-4 text-purple-400" />,
    hint: '/summarize',
  },
  {
    id: 'cmd-recap',
    command: '/recap',
    name: 'Daily Workspace Recap',
    description: 'Generate your personal daily digest across all channels',
    category: 'catchup',
    icon: <Calendar className="h-4 w-4 text-blue-400" />,
    hint: '/recap',
  },
];

export const SlashCommandDropdown: React.FC<SlashCommandDropdownProps> = ({
  query,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const cleanQuery = query.toLowerCase().replace(/^\//, '').trim();

  const filteredCommands = useMemo(() => {
    if (!cleanQuery) return COMMAND_DEFINITIONS;
    return COMMAND_DEFINITIONS.filter(
      (c) =>
        c.command.toLowerCase().includes(cleanQuery) ||
        c.name.toLowerCase().includes(cleanQuery) ||
        c.description.toLowerCase().includes(cleanQuery),
    );
  }, [cleanQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredCommands[selectedIndex]) {
          e.preventDefault();
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-3 mb-2 w-80 max-h-72 overflow-y-auto rounded-xl shadow-2xl border z-50 animate-in zoom-in-95"
      style={{
        background: 'var(--color-elevated)',
        borderColor: 'var(--color-border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-tertiary)' }}
      >
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-violet-400" />
          <span>AI Agents & Commands</span>
        </span>
        <span className="font-mono text-[9px]">↑↓ to navigate · ↵ to select</span>
      </div>

      <div className="p-1 space-y-0.5">
        {filteredCommands.map((item, idx) => {
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => onSelect(item)}
              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
              style={{
                background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                color: isSelected ? 'var(--color-active-text)' : 'var(--color-text-primary)',
              }}
            >
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-input)' }}
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {item.command}
                  </span>
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {item.name}
                  </span>
                  <span className="ml-auto text-[9px] uppercase px-1 rounded bg-violet-500/20 text-violet-300 font-bold">
                    {item.category === 'agent' ? 'Agent' : 'Action'}
                  </span>
                </div>
                <p className="text-[11px] leading-snug line-clamp-1 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
