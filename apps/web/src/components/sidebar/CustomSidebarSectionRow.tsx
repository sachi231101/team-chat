import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Folder,
  Briefcase,
  Code,
  Target,
  Zap,
  Flame,
  Sparkles,
  Shield,
  Heart,
  Layers,
  Hash,
} from 'lucide-react';
import { useUiStore, CustomSidebarSection } from '../../stores';
import { useWorkspace } from '../../hooks';
import { ChannelRow } from './ChannelRow';
import { Tooltip } from '../ui';
import { cn } from '../../lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Layers,
  briefcase: Briefcase,
  code: Code,
  target: Target,
  zap: Zap,
  flame: Flame,
  sparkles: Sparkles,
  shield: Shield,
  heart: Heart,
};

interface CustomSidebarSectionRowProps {
  section: CustomSidebarSection;
}

export const CustomSidebarSectionRow: React.FC<CustomSidebarSectionRowProps> = ({ section }) => {
  const {
    toggleCustomSectionCollapse,
    deleteCustomSection,
    updateCustomSection,
    setTargetSectionForNewChannel,
    setCreateChannelModalOpen,
  } = useUiStore();
  const { channels } = useWorkspace();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const IconComponent = ICON_MAP[section.icon || 'folder'] || Layers;

  // Resolve active channels that belong to this section
  const sectionChannels = section.channelIds
    .map((id) => channels.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const isCollapsed = Boolean(section.isCollapsed);

  const handleCreateChannelInSection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetSectionForNewChannel(section.id);
    setCreateChannelModalOpen(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      updateCustomSection(section.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="px-2 pt-1.5">
      {/* ── Section Header ── */}
      <div className="group relative mb-0.5 flex items-center justify-between rounded-md px-2 py-1 hover-surface">
        {isEditing ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 mr-2">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                if (editName.trim()) updateCustomSection(section.id, { name: editName.trim() });
                setIsEditing(false);
              }}
              className="w-full bg-stone-900 text-stone-100 text-xs px-2 py-0.5 rounded border border-violet-500 outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => toggleCustomSectionCollapse(section.id)}
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors flex-1 text-left min-w-0"
            style={{ color: 'var(--color-text-secondary)' }}
            title={isCollapsed ? `Expand ${section.name}` : `Collapse ${section.name}`}
          >
            {isCollapsed ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-stone-200 transition-transform" />
            )}
            <IconComponent className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            <span className="truncate">{section.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded-full font-normal shrink-0"
              style={{
                background: 'var(--color-elevated)',
                color: 'var(--color-text-tertiary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {sectionChannels.length}
            </span>
          </button>
        )}

        {/* Action icons on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content={`Add channel to ${section.name}`} side="right">
            <button
              type="button"
              onClick={handleCreateChannelInSection}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              aria-label="Add channel"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              aria-label="Section options"
            >
              <MoreVertical className="h-3 w-3" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl p-1 shadow-2xl z-50 border animate-in fade-in zoom-in-95"
                style={{
                  background: 'var(--color-modal)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsEditing(true);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-stone-200 hover:bg-white/5 transition-colors text-left"
                >
                  <Edit2 className="h-3.5 w-3.5 text-stone-400" />
                  <span>Rename section</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setTargetSectionForNewChannel(section.id);
                    setCreateChannelModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-stone-200 hover:bg-white/5 transition-colors text-left"
                >
                  <Plus className="h-3.5 w-3.5 text-stone-400" />
                  <span>Add channel</span>
                </button>

                <div className="my-1 border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    deleteCustomSection(section.id);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete section</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Collapsible Channel Items ── */}
      {!isCollapsed && (
        <div className="space-y-px pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {sectionChannels.map((channel) => (
            <ChannelRow key={`sec-${section.id}-${channel.id}`} channel={channel} />
          ))}

          {sectionChannels.length === 0 && (
            <button
              type="button"
              onClick={handleCreateChannelInSection}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] text-stone-500 hover:text-violet-300 transition-colors rounded hover:bg-stone-900/40"
            >
              <Plus className="w-3 h-3" />
              <span>Add channel to {section.name}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
