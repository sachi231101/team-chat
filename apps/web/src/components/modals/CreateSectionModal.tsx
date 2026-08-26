import React, { useState, useEffect, useRef } from 'react';
import {
  FolderPlus,
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
        {/* Section Name */}
        <div>
          <label className="text-xs font-bold text-stone-200 uppercase tracking-wider block mb-1.5">
            Section Name <span className="text-violet-400">*</span>
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
            className={`w-full rounded-xl bg-stone-900 text-stone-100 px-3.5 py-2.5 text-xs border focus:outline-none transition-all ${
              error
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-stone-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
            }`}
          />
          {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}

          {/* Quick Suggestion Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-stone-500 uppercase font-bold">Suggestions:</span>
            {SECTION_SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Section Icon Selection */}
        <div>
          <label className="text-xs font-bold text-stone-300 block mb-1.5">Choose Icon</label>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map((item) => {
              const isSelected = selectedIcon === item.id;
              const IconComp = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-bold shadow-sm'
                      : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                  }`}
                >
                  <IconComp className="w-4 h-4 mb-1" />
                  <span className="text-[10px] truncate max-w-full">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional: Add existing channels right away */}
        {channels.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-300">
                Add Existing Channels <span className="text-stone-500 font-normal">(optional)</span>
              </label>
              {selectedChannelIds.length > 0 && (
                <span className="text-[11px] text-violet-400 font-medium">
                  {selectedChannelIds.length} selected
                </span>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-stone-800 bg-stone-900/60 p-1.5 space-y-1">
              {channels.map((channel) => {
                const isSelected = selectedChannelIds.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannelSelection(channel.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-violet-500/15 text-violet-300 font-semibold'
                        : 'hover:bg-stone-800 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-stone-400" />
                      <span>{channel.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Section</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
