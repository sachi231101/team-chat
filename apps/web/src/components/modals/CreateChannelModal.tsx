import React, { useState } from 'react';
import { Hash, Lock } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Modal, Input, Button } from '../ui';
import { cn } from '../../lib/utils';

export const CreateChannelModal: React.FC = () => {
  const { createChannelModalOpen, setCreateChannelModalOpen, createChannel } = useChatDataStore();

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
    createChannel(name, description, topic, type);
    setName('');
    setDescription('');
    setTopic('');
    setType('public');
  };

  return (
    <Modal
      isOpen={createChannelModalOpen}
      onClose={() => setCreateChannelModalOpen(false)}
      title="Create a channel"
      description="Channels are where your team communicates. They’re best when organized around a topic — #leads, for example."
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Name
          </label>
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
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Topic <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is this channel about?"
            maxLength={250}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about what should be discussed here"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Channel Visibility Type */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-300">Visibility</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('public')}
              className={cn(
                'flex flex-col text-left p-3 rounded-xl border transition-all',
                type === 'public'
                  ? 'border-indigo-500 bg-indigo-950/30 text-white'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700',
              )}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                <Hash className="h-3.5 w-3.5 text-indigo-400" />
                <span>Public</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Anyone in workspace can view & join
              </span>
            </button>

            <button
              type="button"
              onClick={() => setType('private')}
              className={cn(
                'flex flex-col text-left p-3 rounded-xl border transition-all',
                type === 'private'
                  ? 'border-indigo-500 bg-indigo-950/30 text-white'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700',
              )}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Private</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Only invited members can view & join
              </span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
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
