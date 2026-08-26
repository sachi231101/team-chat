import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  Link,
  Check,
  Copy,
  Users,
  Send,
  Loader2,
  Sparkles,
  Shield,
  X,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace } from '../../hooks';
import { Modal, Button, Avatar, Badge } from '../ui';

export const InviteTeammatesModal: React.FC = () => {
  const { inviteModalOpen, setInviteModalOpen } = useUiStore();
  const { users, currentUser } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'email' | 'link' | 'members'>('email');
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!inviteModalOpen) return null;

  const inviteLink = `${window.location.origin}/join/wp-teamchat-main`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvites = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim() || isSending) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setEmails('');
        setCustomMessage('');
        setInviteModalOpen(false);
      }, 1500);
    }, 800);
  };

  return (
    <Modal
      isOpen={inviteModalOpen}
      onClose={() => setInviteModalOpen(false)}
      title="Invite Teammates to Acme HQ"
      description="Bring your team into Team Chat to start collaborating, deciding, and completing work together."
      maxWidth="lg"
    >
      {/* Tab Selectors */}
      <div
        className="flex items-center gap-2 border-b pt-2 pb-2 text-xs font-semibold"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'email'
              ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Invite by Email</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('link')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'link'
              ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>Share Invite Link</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'members'
              ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Workspace Directory ({users.length})</span>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* TAB 1: Email Invites */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendInvites} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-200 uppercase tracking-wider block mb-1.5">
                Email Addresses
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="name@company.com, colleague@company.com..."
                rows={3}
                required
                className="w-full rounded-xl bg-stone-900 text-stone-100 p-3 text-xs border border-stone-800 focus:outline-none focus:border-violet-500 leading-relaxed resize-none"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Enter one or multiple email addresses separated by commas or line breaks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-xl bg-stone-900 text-stone-200 px-3 py-2 text-xs border border-stone-800 focus:outline-none"
                >
                  <option value="member">Regular Member</option>
                  <option value="admin">Workspace Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Default Channels
                </label>
                <input
                  type="text"
                  disabled
                  value="#general, #announcements"
                  className="w-full rounded-xl bg-stone-950 text-stone-400 px-3 py-2 text-xs border border-stone-800 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1.5">
                Personal Invitation Note <span className="text-stone-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Hey team, join our new AI-powered Team Chat workspace for fast communication and work execution!"
                rows={2}
                className="w-full rounded-xl bg-stone-900 text-stone-100 p-2.5 text-xs border border-stone-800 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div
              className="flex items-center justify-between border-t pt-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>

              {sentSuccess ? (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>Invitations Sent!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!emails.trim() || isSending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  }}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Invites...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Invitations</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: Share Invite Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                <Link className="w-4 h-4 text-violet-400" />
                <span>Workspace Join Link</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Anyone with this link and a company email can instantly join the Acme HQ workspace.
              </p>

              <div className="flex items-center gap-2 bg-stone-950 p-2 rounded-xl border border-stone-800">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-transparent text-xs font-mono text-stone-200 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: Members Directory */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            <p className="text-xs text-stone-400">
              Active people and AI teammates in Acme HQ ({users.length} members):
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} src={u.avatarUrl} size="sm" status={u.status} showStatus />
                    <div>
                      <p className="font-semibold text-stone-200">{u.name}</p>
                      <p className="text-[11px] text-stone-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                    {u.id.startsWith('usr-agent-') ? 'AI Agent' : 'Member'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
