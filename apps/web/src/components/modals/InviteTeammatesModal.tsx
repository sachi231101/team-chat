import React, { useState } from 'react';
import { Mail, Link, Check, Copy, Send, Loader2 } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Modal, Button } from '../ui';

function parseEmails(raw: string): string[] {
  const parts = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Teammate';
  return local
    .replace(/[._+-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Teammate';
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const InviteTeammatesModal: React.FC = () => {
  const { inviteModalOpen, setInviteModalOpen, setPeopleModalOpen } = useUiStore();
  const { users } = useWorkspace();
  const { createUser } = useChatMutations();

  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
  const [emails, setEmails] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = `${window.location.origin}/?invite=wp-teamchat-main`;

  const resetAndClose = () => {
    setEmails('');
    setError(null);
    setSentCount(0);
    setActiveTab('email');
    setInviteModalOpen(false);
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim() || isSending) return;

    const parsed = parseEmails(emails);
    const invalid = parsed.filter((email) => !isLikelyEmail(email));
    if (parsed.length === 0) {
      setError('Enter at least one email address.');
      return;
    }
    if (invalid.length > 0) {
      setError(`Invalid email: ${invalid[0]}`);
      return;
    }

    const existing = new Set(users.map((u) => u.email.toLowerCase()));
    const toCreate = parsed.filter((email) => !existing.has(email));
    const skipped = parsed.length - toCreate.length;

    if (toCreate.length === 0) {
      setError(
        skipped > 0
          ? 'Everyone you entered is already in this workspace. Open People & Directory instead.'
          : 'Enter at least one new email address.',
      );
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      for (const email of toCreate) {
        const name = nameFromEmail(email);
        await createUser.mutateAsync({
          name,
          email,
          title: 'Teammate',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        });
      }
      setSentCount(toCreate.length);
      setTimeout(() => {
        resetAndClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add teammates.');
    } finally {
      setIsSending(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--color-accent-muted)' : 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    border: active ? '1px solid var(--color-accent)' : '1px solid transparent',
  });

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-input)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <Modal
      isOpen={inviteModalOpen}
      onClose={resetAndClose}
      title="Invite teammates"
      description="Add people to this workspace. They’ll appear in People & Directory and can join public channels."
      maxWidth="lg"
    >
      <div
        className="flex items-center gap-2 border-b pt-2 pb-2 text-xs font-semibold"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
          style={tabStyle(activeTab === 'email')}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Add by email</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('link')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
          style={tabStyle(activeTab === 'link')}
        >
          <Link className="h-3.5 w-3.5" />
          <span>Share link</span>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {activeTab === 'email' && (
          <form onSubmit={(e) => void handleSendInvites(e)} className="space-y-4">
            <div>
              <label
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email addresses
              </label>
              <textarea
                value={emails}
                onChange={(e) => {
                  setEmails(e.target.value);
                  setError(null);
                }}
                placeholder="name@company.com, colleague@company.com..."
                rows={3}
                required
                className="w-full resize-none rounded-xl p-3 text-xs leading-relaxed focus:outline-none"
                style={fieldStyle}
              />
              <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                Separate multiple emails with commas or new lines. Creates mock users in this workspace (no email is sent).
              </p>
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'var(--color-danger, #f43f5e)' }}>
                {error}{' '}
                {error.includes('People & Directory') && (
                  <button
                    type="button"
                    className="underline"
                    style={{ color: 'var(--color-accent)' }}
                    onClick={() => {
                      resetAndClose();
                      setPeopleModalOpen(true);
                    }}
                  >
                    Open directory
                  </button>
                )}
              </p>
            )}

            <div
              className="flex items-center justify-between border-t pt-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Button type="button" variant="secondary" onClick={resetAndClose}>
                Cancel
              </Button>

              {sentCount > 0 ? (
                <div
                  className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold"
                  style={{
                    background: 'var(--color-accent-muted)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Check className="h-4 w-4" />
                  <span>
                    Added {sentCount} teammate{sentCount === 1 ? '' : 's'}
                  </span>
                </div>
              ) : (
                <Button type="submit" variant="primary" disabled={!emails.trim() || isSending} className="gap-2">
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Add to workspace</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        )}

        {activeTab === 'link' && (
          <div className="space-y-4">
            <div
              className="space-y-3 rounded-xl border p-4"
              style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <Link className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                <span>Workspace link</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Share this link so teammates know which workspace to open. Join-via-link isn’t built yet — use Add by email to create people in this mock workspace.
              </p>

              <div
                className="flex items-center gap-2 rounded-xl border p-2"
                style={{ background: 'var(--color-input)', borderColor: 'var(--color-border)' }}
              >
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 select-all bg-transparent font-mono text-xs focus:outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <Button type="button" variant="primary" size="xs" onClick={handleCopyLink} className="gap-1.5 shrink-0">
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button type="button" variant="secondary" onClick={resetAndClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
