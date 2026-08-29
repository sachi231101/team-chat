import React, { useState, useEffect, useRef } from 'react';
import { Hash, Lock, Loader2, Plus } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useChatMutations } from '../../hooks';
import { Modal, Button } from '../ui';
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
            <label
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Channel Name <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            {name && (
              <span
                className="text-[11px] font-mono font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                #{name}
              </span>
            )}
          </div>
          <div className="relative">
            <div
              className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {type === 'private' ? (
                <Lock className="h-4 w-4" style={{ color: 'var(--color-away, #f59e0b)' }} />
              ) : (
                <Hash className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. project-apollo, marketing, general"
              maxLength={80}
              className="form-input w-full rounded-xl pl-9 pr-3.5 py-2.5 text-xs transition-all"
              style={
                error
                  ? { borderColor: 'var(--color-danger)' }
                  : undefined
              }
            />
          </div>
          {error && (
            <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          {/* Quick Suggestions Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] uppercase font-bold"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Suggestions:
            </span>
            {CHANNEL_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors hover-surface"
                style={{
                  background: 'var(--color-elevated)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                #{s}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Field */}
        <div>
          <label
            className="text-xs font-bold block mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Topic <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is the main purpose of this channel?"
            maxLength={250}
            className="form-input w-full rounded-xl px-3.5 py-2 text-xs transition-all"
          />
        </div>

        {/* Description Field */}
        <div>
          <label
            className="text-xs font-bold block mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Description <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should be discussed here? Provide guidelines for members..."
            rows={2}
            className="form-textarea w-full rounded-xl px-3.5 py-2 text-xs transition-all resize-none"
          />
        </div>

        {/* Visibility (Public vs Private) */}
        <div className="space-y-2 pt-1">
          <label
            className="text-xs font-bold block"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Channel Visibility
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('public')}
              className={cn(
                'flex flex-col rounded-xl border p-3 text-left transition-all cursor-pointer hover-surface',
                type === 'public'
                  ? 'border-violet-500 shadow-sm ring-1 ring-violet-500/50'
                  : '',
              )}
              style={
                type === 'public'
                  ? {
                      borderColor: 'var(--color-accent)',
                      background: 'var(--color-accent-muted)',
                    }
                  : {
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-input)',
                    }
              }
            >
              <div
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Hash className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                <span>Public Channel</span>
              </div>
              <span
                className="mt-1 text-[11px] leading-snug"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Anyone in the workspace can find, view, and join this channel.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('private')}
              className={cn(
                'flex flex-col rounded-xl border p-3 text-left transition-all cursor-pointer hover-surface',
                type === 'private'
                  ? 'border-violet-500 shadow-sm ring-1 ring-violet-500/50'
                  : '',
              )}
              style={
                type === 'private'
                  ? {
                      borderColor: 'var(--color-accent)',
                      background: 'var(--color-accent-muted)',
                    }
                  : {
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-input)',
                    }
              }
            >
              <div
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Lock className="h-4 w-4" style={{ color: 'var(--color-away, #f59e0b)' }} />
                <span>Private Channel</span>
              </div>
              <span
                className="mt-1 text-[11px] leading-snug"
                style={{ color: 'var(--color-text-secondary)' }}
              >
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
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim() || createChannel.isPending}
            className="gap-1.5"
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
          </Button>
        </div>
      </form>
    </Modal>
  );
};
