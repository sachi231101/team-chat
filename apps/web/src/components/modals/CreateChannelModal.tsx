import React, { useState } from 'react';
import { Hash, Lock } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useChatMutations } from '../../hooks';
import { Modal, Input, Button } from '../ui';
import { cn } from '../../lib/utils';

export const CreateChannelModal: React.FC = () => {
  const { createChannelModalOpen, setCreateChannelModalOpen } = useUiStore();
  const { createChannel } = useChatMutations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    setName(formatted);
    if (formatted.length > 0) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }
    createChannel.mutate({ name, description, topic, type });
    setName('');
    setDescription('');
    setTopic('');
    setType('public');
  };

  const visibilityCardClass = (selected: boolean) =>
    cn(
      'flex flex-col rounded-xl border p-3 text-left transition-all',
      selected ? 'option-card-selected' : 'option-card hover-surface',
    );

  return (
    <Modal
      isOpen={createChannelModalOpen}
      onClose={() => setCreateChannelModalOpen(false)}
      title="Create a channel"
      description="Channels are where your team communicates. They’re best when organized around a topic — #leads, for example."
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="form-label mb-1.5 block text-xs font-semibold">Name</label>
          <Input
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. plan-launch"
            icon={type === 'private' ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            error={error}
            maxLength={80}
          />
        </div>

        <div>
          <label className="form-label mb-1.5 block text-xs font-semibold">
            Topic <span className="form-label-muted font-normal">(optional)</span>
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is this channel about?"
            maxLength={250}
          />
        </div>

        <div>
          <label className="form-label mb-1.5 block text-xs font-semibold">
            Description <span className="form-label-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about what should be discussed here"
            rows={2}
            className="form-textarea w-full rounded-lg px-3.5 py-2 text-xs"
          />
        </div>

        <div className="space-y-2 pt-1">
          <label className="form-label block text-xs font-semibold">Visibility</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('public')}
              className={visibilityCardClass(type === 'public')}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary">
                <Hash className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                <span>Public</span>
              </div>
              <span className="mt-1 text-[11px] text-theme-secondary">
                Anyone in workspace can view & join
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('private')}
              className={visibilityCardClass(type === 'private')}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary">
                <Lock className="h-3.5 w-3.5" style={{ color: 'var(--color-pin)' }} />
                <span>Private</span>
              </div>
              <span className="mt-1 text-[11px] text-theme-secondary">
                Only invited members can view & join
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCreateChannelModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
