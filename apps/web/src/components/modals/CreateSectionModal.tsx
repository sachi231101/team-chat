import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  Target,
  Code,
  Briefcase,
  Shield,
  Heart,
  Layers,
  Check,
  Plus,
  Hash,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Modal, Button } from '../ui';

const ICONS = [
  { id: 'folder', label: 'Folder', Icon: Layers },
  { id: 'briefcase', label: 'Projects', Icon: Briefcase },
  { id: 'code', label: 'Engineering', Icon: Code },
  { id: 'target', label: 'Goals', Icon: Target },
  { id: 'zap', label: 'Fast/Ops', Icon: Zap },
  { id: 'flame', label: 'Hot/Priority', Icon: Flame },
  { id: 'sparkles', label: 'AI/Creative', Icon: Sparkles },
  { id: 'shield', label: 'Security', Icon: Shield },
  { id: 'heart', label: 'Culture', Icon: Heart },
];

const SECTION_SUGGESTIONS = [
  { name: 'Projects', icon: 'briefcase' },
  { name: 'Engineering', icon: 'code' },
  { name: 'Marketing & Growth', icon: 'target' },
  { name: 'Design & UI', icon: 'sparkles' },
  { name: 'Incidents & Ops', icon: 'zap' },
  { name: 'Client Work', icon: 'briefcase' },
  { name: 'Social & Fun', icon: 'heart' },
];

const fieldStyle: React.CSSProperties = {
  background: 'var(--color-input)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
};

export const CreateSectionModal: React.FC = () => {
  const { createSectionModalOpen, setCreateSectionModalOpen, createCustomSection, addChannelToCustomSection } =
    useUiStore();
  const { channels } = useWorkspace();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('briefcase');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (createSectionModalOpen) {
      setName('');
      setSelectedIcon('briefcase');
      setSelectedChannelIds([]);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [createSectionModalOpen]);

  const handleSuggestionClick = (suggestion: { name: string; icon: string }) => {
    setName(suggestion.name);
    setSelectedIcon(suggestion.icon);
    setError('');
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a section name');
      return;
    }

    const newSectionId = createCustomSection(cleanName, selectedIcon);
    for (const chId of selectedChannelIds) {
      addChannelToCustomSection(newSectionId, chId);
    }

    setCreateSectionModalOpen(false);
  };

  return (
    <Modal
      isOpen={createSectionModalOpen}
      onClose={() => setCreateSectionModalOpen(false)}
      title="Create Sidebar Section"
      description="Organize your channels into custom collapsible categories like Projects, Teams, or Initiatives."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Section Name <span style={{ color: 'var(--color-accent)' }}>*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            placeholder="e.g. Projects, Engineering, Marketing, Operations..."
            maxLength={50}
            className="w-full rounded-xl px-3.5 py-2.5 text-xs transition-all focus:outline-none"
            style={{
              ...fieldStyle,
              border: error
                ? '1px solid var(--color-danger)'
                : '1px solid var(--color-border)',
            }}
          />
          {error && (
            <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Suggestions:
            </span>
            {SECTION_SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors hover-surface"
                style={{
                  background: 'var(--color-elevated)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-bold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Choose Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map((item) => {
              const isSelected = selectedIcon === item.id;
              const IconComp = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  className="flex flex-col items-center justify-center rounded-xl border p-2 text-xs transition-all"
                  style={
                    isSelected
                      ? {
                          borderColor: 'var(--color-accent)',
                          background: 'var(--color-accent-muted)',
                          color: 'var(--color-accent)',
                          fontWeight: 700,
                        }
                      : {
                          borderColor: 'var(--color-border)',
                          background: 'var(--color-input)',
                          color: 'var(--color-text-secondary)',
                        }
                  }
                >
                  <IconComp className="mb-1 h-4 w-4" />
                  <span className="max-w-full truncate text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {channels.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                Add Existing Channels{' '}
                <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
                  (optional)
                </span>
              </label>
              {selectedChannelIds.length > 0 && (
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>
                  {selectedChannelIds.length} selected
                </span>
              )}
            </div>
            <div
              className="max-h-36 space-y-1 overflow-y-auto rounded-xl border p-1.5"
              style={{
                background: 'var(--color-input)',
                borderColor: 'var(--color-border)',
              }}
            >
              {channels.map((channel) => {
                const isSelected = selectedChannelIds.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannelSelection(channel.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                    style={
                      isSelected
                        ? {
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)',
                            fontWeight: 600,
                          }
                        : {
                            color: 'var(--color-text-primary)',
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--color-sidebar-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Hash
                        className="h-3.5 w-3.5"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      />
                      <span>{channel.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="flex justify-end gap-2.5 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCreateSectionModalOpen(false)}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-40"
            style={{ background: 'var(--color-accent)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Section</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
