import React, { useState } from 'react';
import { Check, Search, UserPlus, AlertCircle } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { chatService } from '../../services';
import { Modal, Button, Avatar, Input } from '../ui';
import { cn } from '../../lib/utils';

export const InviteModal: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [invitedSuccess, setInvitedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { inviteModalOpen, setInviteModalOpen, activeId } = useUiStore();
  const { users, currentUser, channels } = useWorkspace();

  const currentChannel = channels.find((c) => c.id === activeId);

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleInvite = async () => {
    if (selectedUserIds.length === 0 || !currentChannel) return;

    setIsLoading(true);
    setInviteError(null);

    try {
      await chatService.addChannelMembers(currentChannel.id, selectedUserIds);
      setInvitedSuccess(true);
      setTimeout(() => {
        setInvitedSuccess(false);
        setSelectedUserIds([]);
        setInviteModalOpen(false);
      }, 1200);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to add members.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteError(null);
    setSelectedUserIds([]);
    setInviteModalOpen(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.title?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <Modal
      isOpen={inviteModalOpen}
      onClose={handleClose}
      title={`Add members to #${currentChannel?.name || 'channel'}`}
      description="Invite colleagues from your workspace to participate in this discussion."
    >
      <div className="mt-4 space-y-4">
        <Input
          placeholder="Search team members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />

        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
          {filteredUsers.map((u) => {
            const isSelected = selectedUserIds.includes(u.id);
            return (
              <div
                key={u.id}
                onClick={() => toggleSelect(u.id)}
                className="flex items-center justify-between p-2.5 hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={u.name} src={u.avatarUrl} size="sm" status={u.status} showStatus />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">{u.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{u.title}</span>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md border transition-all',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-700 bg-slate-800 text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {inviteError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {selectedUserIds.length} member{selectedUserIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={selectedUserIds.length === 0 || isLoading}
              onClick={handleInvite}
              className="gap-1.5"
            >
              {invitedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>{isLoading ? 'Adding…' : 'Add to Channel'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
