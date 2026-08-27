import React, { useEffect, useRef, useState } from 'react';
import {
  Smile,
  Check,
  X,
  User,
  Settings,
  Building2,
  Calendar,
  Circle,
  ChevronDown,
  ChevronUp,
  Users,
  Camera,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { chatService } from '../../services';
import { Button, Avatar, Input } from '../ui';
import { UserStatus } from '@team-chat/shared';

const PRESENCE: Array<{ id: UserStatus; label: string; hint: string; color: string }> = [
  { id: 'online', label: 'Active', hint: 'Available to chat', color: 'var(--color-online)' },
  { id: 'busy', label: 'Do not disturb', hint: 'Mentions only', color: 'var(--color-busy, #f43f5e)' },
  { id: 'away', label: 'Away', hint: 'Stepped away', color: 'var(--color-away, #f59e0b)' },
  { id: 'offline', label: 'Invisible', hint: 'Appear offline', color: 'var(--color-text-tertiary)' },
];

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function formatJoined(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const ProfileView: React.FC = () => {
  const { setProfileModalOpen, setSettingsModalOpen } = useUiStore();
  const { currentUser, users } = useWorkspace();
  const { updateStatus, updateProfile, switchUser } = useChatMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title || '');
  const [email, setEmail] = useState(currentUser.email);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || '');
  const [status, setStatus] = useState<UserStatus>(currentUser.status);
  const [saved, setSaved] = useState(false);
  const [mockOpen, setMockOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentUser.name);
    setTitle(currentUser.title || '');
    setEmail(currentUser.email);
    setAvatarUrl(currentUser.avatarUrl || '');
    setStatusMessage(currentUser.statusMessage || '');
    setStatus(currentUser.status);
    setAvatarError(null);
  }, [currentUser]);

  const close = () => setProfileModalOpen(false);

  const handleAvatarPick = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(null);

    if (!AVATAR_TYPES.has(file.type)) {
      setAvatarError('Use a JPG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Image must be 5 MB or smaller.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploaded = await chatService.uploadAttachment(file);
      setAvatarUrl(uploaded.url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStatus.mutateAsync({ status, statusMessage });
    await updateProfile.mutateAsync({ name, title, email, avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const labelStyle: React.CSSProperties = { color: 'var(--color-text-secondary)' };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Profile
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              close();
              setSettingsModalOpen(true);
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Settings className="h-3.5 w-3.5" />
            Preferences
          </button>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-6 pb-10">
          <div
            className="flex items-start gap-4 rounded-xl border p-5"
            style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border)' }}
          >
            <div className="relative shrink-0">
              <Avatar
                name={name || currentUser.name}
                src={avatarUrl || undefined}
                size="xl"
                status={status}
                showStatus
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-colors disabled:opacity-60"
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-main)',
                  color: '#fff',
                }}
                aria-label="Upload profile photo"
                title="Upload photo"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => void handleAvatarPick(e.target.files?.[0])}
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="truncate text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {name || currentUser.name}
              </h3>
              <p className="mt-0.5 truncate text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {title || 'No title set'}
              </p>
              <p className="mt-1 truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {email}
              </p>
              {statusMessage ? (
                <p className="mt-2 truncate text-xs italic" style={{ color: 'var(--color-accent)' }}>
                  “{statusMessage}”
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  className="gap-1"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                  {uploadingAvatar ? 'Uploading…' : 'Upload photo'}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="gap-1"
                    disabled={uploadingAvatar}
                    onClick={() => {
                      setAvatarUrl('');
                      setAvatarError(null);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                ) : null}
              </div>
              {avatarError && (
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--color-danger, #f43f5e)' }}>
                  {avatarError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="flex items-start gap-2.5 rounded-xl border p-3"
              style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border)' }}
            >
              <Building2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  Workspace
                </p>
                <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Acme HQ
                </p>
                <p className="truncate text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {currentUser.workplaceId}
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-2.5 rounded-xl border p-3"
              style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border)' }}
            >
              <Calendar className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  Joined
                </p>
                <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatJoined(currentUser.createdAt)}
                </p>
                <p className="truncate text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {users.length} people in workspace
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Presence
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESENCE.map((p) => {
                  const active = status === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setStatus(p.id)}
                      className="rounded-xl border p-2.5 text-left transition-colors"
                      style={{
                        background: active ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
                        borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Circle className="h-2.5 w-2.5 fill-current" style={{ color: p.color }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {p.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {p.hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={labelStyle}>
                Status message
              </label>
              <Input
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="What are you working on?"
                icon={<Smile className="h-4 w-4" />}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Account
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={labelStyle}>
                    Display name
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={labelStyle}>
                    Title / role
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Product Designer"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={labelStyle}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div
              className="flex justify-end gap-2.5 border-t pt-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Button type="button" variant="secondary" onClick={close}>
                Close
              </Button>
              <Button type="submit" variant="primary" disabled={uploadingAvatar}>
                {saved ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>

          <div
            className="rounded-xl border"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-elevated)' }}
          >
            <button
              type="button"
              onClick={() => setMockOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Mock identity (dev)
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    Switch users for testing. Not part of the real product — Workplace auth will replace this.
                  </p>
                </div>
              </div>
              {mockOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              )}
            </button>

            {mockOpen && (
              <div className="space-y-1.5 border-t px-3 pb-3 pt-2" style={{ borderColor: 'var(--color-border)' }}>
                <p className="px-1 pb-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  To add new people, use Invite teammates. Here you only switch who you’re logged in as.
                </p>
                {users.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => switchUser(u)}
                      className="flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                        background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={u.name} src={u.avatarUrl} size="sm" status={u.status} showStatus />
                        <span className="truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {u.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
