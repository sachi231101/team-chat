import React, { useMemo, useState } from 'react';
import { X, Link2, Mail, Copy, ChevronDown, Hash, Check } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';

const WORKSPACE_NAME = 'Acme HQ';

type InviteTab = 'link' | 'email';

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && e.includes('@'));
}

export const InviteModal: React.FC = () => {
  const { inviteModalOpen, setInviteModalOpen } = useUiStore();
  const { channels } = useWorkspace();
  const { createUser } = useChatMutations();

  const [activeTab, setActiveTab] = useState<InviteTab>('link');
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [channelQuery, setChannelQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteLink = useMemo(
    () => `${window.location.origin}/invite/acme-hq?token=shared-mock-invite`,
    [],
  );

  const inviteMessage = `Let's work together in ${WORKSPACE_NAME} on Team Chat. This invite expires in 29 days:\n${inviteLink}`;

  const emails = parseEmails(emailInput);
  const canSend = emails.length > 0 && !sending;

  const suggestedChannels = channels
    .filter((c) => c.type === 'public')
    .filter((c) => !selectedChannelIds.includes(c.id))
    .slice(0, 3);

  const filteredChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(channelQuery.toLowerCase()) &&
      !selectedChannelIds.includes(c.id),
  );

  const selectedChannels = channels.filter((c) => selectedChannelIds.includes(c.id));

  const handleClose = () => {
    setInviteModalOpen(false);
    setActiveTab('link');
    setCopied(false);
    setEmailInput('');
    setSelectedChannelIds([]);
    setChannelQuery('');
    setSending(false);
    setSent(false);
    setError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy invite link.');
    }
  };

  const addChannel = (channelId: string) => {
    setSelectedChannelIds((prev) => (prev.includes(channelId) ? prev : [...prev, channelId]));
    setChannelQuery('');
  };

  const removeChannel = (channelId: string) => {
    setSelectedChannelIds((prev) => prev.filter((id) => id !== channelId));
  };

  const handleSendInvites = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      for (const email of emails) {
        const localPart = email.split('@')[0] || 'teammate';
        const name = localPart
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        await createUser.mutateAsync({
          name,
          email,
          title: 'Workspace member',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        });
      }
      setSent(true);
      setTimeout(handleClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invites.');
    } finally {
      setSending(false);
    }
  };

  if (!inviteModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[640px] overflow-hidden rounded-xl shadow-2xl"
        style={{ background: 'var(--color-modal)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <h2 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            Invite people to {WORKSPACE_NAME}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-6 border-b px-6" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className="flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors"
            style={{
              borderBottomColor: activeTab === 'link' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'link' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            <Link2 className="h-4 w-4" />
            Invite link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className="flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors"
            style={{
              borderBottomColor: activeTab === 'email' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'email' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>

        <div className="px-6 py-5">
          {activeTab === 'link' ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Share this link anywhere to easily invite people to {WORKSPACE_NAME}
              </p>

              <div
                className="rounded-lg px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: 'var(--color-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <p>
                  Let&apos;s work together in {WORKSPACE_NAME} on Team Chat. This invite expires in 29 days:
                </p>
                <a
                  href={inviteLink}
                  className="mt-2 inline-block break-all underline"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {inviteLink}
                </a>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white transition-colors"
                  style={{ background: copied ? '#0f766e' : '#007a5a' }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Email addresses
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium"
                    style={{ color: '#1d9bd1' }}
                  >
                    Add from Google Workspace
                  </button>
                </div>
                <textarea
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Ex. ellis@gmail.com, maria@gmail.com"
                  rows={4}
                  className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'var(--color-input)',
                    border: '1px solid #1d9bd1',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button type="button" className="mt-2 text-xs font-medium" style={{ color: '#1d9bd1' }}>
                  Invite as guests or external partners
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Add to channels (optional)
                </label>

                {suggestedChannels.length > 0 && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Suggested:</span>
                    {suggestedChannels.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => addChannel(channel.id)}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-white/5"
                        style={{ color: '#1d9bd1' }}
                      >
                        <span>+</span>
                        <Hash className="h-3 w-3" />
                        <span>{channel.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className="min-h-[42px] rounded-lg px-2 py-1.5"
                  style={{ background: 'var(--color-input)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedChannels.map((channel) => (
                      <span
                        key={channel.id}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-primary)' }}
                      >
                        <Hash className="h-3 w-3" />
                        {channel.name}
                        <button type="button" onClick={() => removeChannel(channel.id)} className="opacity-70 hover:opacity-100">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={channelQuery}
                      onChange={(e) => setChannelQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredChannels[0]) {
                          e.preventDefault();
                          addChannel(filteredChannels[0].id);
                        }
                      }}
                      placeholder={selectedChannels.length === 0 ? 'Search channels' : ''}
                      className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  {channelQuery && filteredChannels.length > 0 && (
                    <div className="mt-1 rounded-md py-1" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                      {filteredChannels.slice(0, 5).map((channel) => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => addChannel(channel.id)}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-white/5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <Hash className="h-3.5 w-3.5" />
                          {channel.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400">{error}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!canSend}
                  onClick={handleSendInvites}
                  className="rounded-md px-5 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed"
                  style={{
                    background: canSend ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    color: canSend ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {sent ? 'Sent!' : sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
