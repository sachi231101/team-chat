import React, { useState } from 'react';
import { Smile, Check, UserPlus, Users, Sparkles } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Modal, Button, Avatar, Input } from '../ui';
import { UserStatus } from '@team-chat/shared';

export const ProfileModal: React.FC = () => {
  const { profileModalOpen, setProfileModalOpen } = useUiStore();
  const { currentUser, users } = useWorkspace();
  const { updateStatus, updateProfile, createUser, switchUser } = useChatMutations();

  const [tab, setTab] = useState<'profile' | 'switch' | 'create'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title || '');
  const [email, setEmail] = useState(currentUser.email);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || '');
  const [status, setStatus] = useState<UserStatus>(currentUser.status);
  const [saved, setSaved] = useState(false);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStatus.mutateAsync({ status, statusMessage });
    await updateProfile.mutateAsync({ name, title, email, avatarUrl });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setProfileModalOpen(false);
    }, 800);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    setCreating(true);
    try {
      const created = await createUser.mutateAsync({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        title: newUserTitle.trim() || undefined,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newUserName)}`,
      });
      switchUser(created);
      setCreating(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setProfileModalOpen(false);
      }, 800);
    } catch {
      setCreating(false);
    }
  };

  return (
    <Modal
      isOpen={profileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      title="User Profile & Identity"
      description="Manage your real profile in PostgreSQL or switch active team member."
    >
      <div className="mt-2 flex border-b border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`pb-2 px-3 border-b-2 transition-colors ${
            tab === 'profile'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Edit My Profile
        </button>
        <button
          type="button"
          onClick={() => setTab('switch')}
          className={`pb-2 px-3 border-b-2 transition-colors ${
            tab === 'switch'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Switch User
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('create')}
          className={`pb-2 px-3 border-b-2 transition-colors ${
            tab === 'create'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-emerald-400" /> Add New User
          </span>
        </button>
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <Avatar
              name={name || currentUser.name}
              src={avatarUrl || currentUser.avatarUrl}
              size="lg"
              status={status}
              showStatus
            />
            <div className="flex flex-col flex-1">
              <span className="text-sm font-semibold text-white">{name || currentUser.name}</span>
              <span className="text-xs text-slate-400">{email}</span>
              <span className="text-[11px] text-emerald-400 font-medium mt-0.5">
                ● Persisted to PostgreSQL
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
            />
          </div>

          {/* Job Title / Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Job Title / Role
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Architect"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Avatar Image URL
            </label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {/* Presence Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Presence
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="online">🟢 Online</option>
              <option value="busy">🔴 Busy (Do Not Disturb)</option>
              <option value="away">🟡 Away</option>
              <option value="offline">⚪ Invisible</option>
            </select>
          </div>

          {/* Custom Status message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status message
            </label>
            <Input
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Building Team Chat 🚀"
              icon={<Smile className="h-4 w-4" />}
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setProfileModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {saved ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Saved to DB!
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      )}

      {tab === 'switch' && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-400">
            Select a real user from your PostgreSQL database to switch active session:
          </p>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    switchUser(u);
                    setName(u.name);
                    setTitle(u.title || '');
                    setEmail(u.email);
                    setAvatarUrl(u.avatarUrl || '');
                    setStatus(u.status);
                    setStatusMessage(u.statusMessage || '');
                    setSaved(true);
                    setTimeout(() => {
                      setSaved(false);
                      setProfileModalOpen(false);
                    }, 500);
                  }}
                  className={`flex w-full items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-950/30'
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatarUrl} size="md" status={u.status} showStatus />
                    <div>
                      <div className="text-xs font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.title || u.email}</div>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 hover:text-white font-medium">
                      Select
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'create' && (
        <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs text-slate-300 flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>Create a new real user profile directly into the PostgreSQL database.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name *
            </label>
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address *
            </label>
            <Input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="alex.morgan@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Job Title / Role
            </label>
            <Input
              value={newUserTitle}
              onChange={(e) => setNewUserTitle(e.target.value)}
              placeholder="e.g. Staff Security Engineer"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTab('profile')}
            >
              Back
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'Creating in DB...' : saved ? 'Created & Logged In!' : 'Create & Switch To User'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
