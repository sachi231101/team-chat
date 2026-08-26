import React, { useState, useEffect, useRef } from 'react';
import { Hash, Lock, Sparkles, Loader2, Plus, Check, Layers, Folder } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useChatMutations } from '../../hooks';
import { Modal, Input, Button } from '../ui';
import { cn } from '../../lib/utils';

const CHANNEL_SUGGESTIONS = [
  'project-launch',
  'team-sync',
  'engineering',
  'design-system',
  'bug-triage',
  'product-roadmap',
  'announcements',
  'watercooler',
];

export const CreateChannelModal: React.FC = () => {
  const {
    createChannelModalOpen,
    setCreateChannelModalOpen,
    targetSectionForNewChannel,
    setTargetSectionForNewChannel,
    addChannelToCustomSection,
  } = useUiStore();
  const { createChannel } = useChatMutations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (createChannelModalOpen) {
      setName('');
      setDescription('');
      setTopic('');
      setType('public');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [createChannelModalOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Replace spaces and special characters with hyphens, lowercase
    const formatted = raw
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
    setName(formatted);
    if (formatted.length > 0) setError('');
  };

  const handleSuggestionClick = (suggestedName: string) => {
    setName(suggestedName);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/^#+/, '');
    if (!cleanName) {
      setError('Please enter a channel name');
      return;
    }
    if (cleanName.length < 2) {
      setError('Channel name must be at least 2 characters');
      return;
    }
    try {
      const newChannel = await createChannel.mutateAsync({
        name: cleanName,
        description: description.trim(),
        topic: topic.trim(),
        type,
      });

      if (targetSectionForNewChannel && newChannel?.id) {
        addChannelToCustomSection(targetSectionForNewChannel, newChannel.id);
      }
      setTargetSectionForNewChannel(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to create channel');
    }
  };

  const visibilityCardClass = (selected: boolean) =>
    cn(
      'flex flex-col rounded-xl border p-3 text-left transition-all cursor-pointer',
      selected
        ? 'border-violet-500 bg-violet-500/10 shadow-sm ring-1 ring-violet-500/50'
        : 'border-stone-800 bg-stone-900/60 hover:bg-stone-900 hover:border-stone-700',
    );

  return (
    <Modal
      isOpen={createChannelModalOpen}
      onClose={() => {
        setCreateChannelModalOpen(false);
        setTargetSectionForNewChannel(null);
      }}
      title="Create a Channel"
      description="Create a dedicated channel for your project, team, topic, or initiative."
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Channel Name Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-200 uppercase tracking-wider">
              Channel Name <span className="text-violet-400">*</span>
            </label>
            {name && (
              <span className="text-[11px] font-mono text-violet-400 font-bold">
                #{name}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              {type === 'private' ? (
                <Lock className="h-4 w-4 text-amber-400" />
              ) : (
                <Hash className="h-4 w-4 text-violet-400" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. project-apollo, marketing, general"
              maxLength={80}
              className={`w-full rounded-xl bg-stone-900 text-stone-100 pl-9 pr-3.5 py-2.5 text-xs border focus:outline-none transition-all ${
                error
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-stone-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
              }`}
            />
          </div>
          {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}

          {/* Quick Suggestions Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-stone-500 uppercase font-bold">Suggestions:</span>
            {CHANNEL_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors"
              >
                #{s}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Field */}
        <div>
          <label className="text-xs font-bold text-stone-300 block mb-1.5">
            Topic <span className="text-stone-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is the main purpose of this channel?"
            maxLength={250}
            className="w-full rounded-xl bg-stone-900 text-stone-100 px-3.5 py-2 text-xs border border-stone-800 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="text-xs font-bold text-stone-300 block mb-1.5">
            Description <span className="text-stone-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should be discussed here? Provide guidelines for members..."
            rows={2}
            className="w-full rounded-xl bg-stone-900 text-stone-100 px-3.5 py-2 text-xs border border-stone-800 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        {/* Visibility (Public vs Private) */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-stone-300 block">Channel Visibility</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('public')}
              className={visibilityCardClass(type === 'public')}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-100">
                <Hash className="h-4 w-4 text-violet-400" />
                <span>Public Channel</span>
              </div>
              <span className="mt-1 text-[11px] text-stone-400 leading-snug">
                Anyone in the workspace can find, view, and join this channel.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('private')}
              className={visibilityCardClass(type === 'private')}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-100">
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Private Channel</span>
              </div>
              <span className="mt-1 text-[11px] text-stone-400 leading-snug">
                Only invited members can find and access this channel.
              </span>
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          className="flex justify-end gap-2.5 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setCreateChannelModalOpen(false);
              setTargetSectionForNewChannel(null);
            }}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={!name.trim() || createChannel.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            }}
          >
            {createChannel.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating #{name}...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Create Channel</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
