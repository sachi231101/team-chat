import React, { useMemo, useState } from 'react';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations, useChannelMembersQuery } from '../../hooks';
import { Modal, Avatar, Button, Input, Badge } from '../ui';

export const AddChannelMembersModal: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    addMembersModalOpen,
    setAddMembersModalOpen,
    activeId,
    activeType,
  } = useUiStore();
  const { users, channels } = useWorkspace();
  const channelId = addMembersModalOpen && activeType === 'channel' ? activeId : null;
  const membersQuery = useChannelMembersQuery(channelId);
  const { addChannelMembers } = useChatMutations();

  const channel = channels.find((c) => c.id === channelId);
  const memberIds = useMemo(
    () => new Set((membersQuery.data ?? []).map((m) => m.id)),
    [membersQuery.data],
  );

  const candidates = users.filter((u) => {
    if (memberIds.has(u.id)) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.title?.toLowerCase().includes(q)
    );
  });

  const toggle = (userId: string) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
    setError(null);
  };

  const handleClose = () => {
    setAddMembersModalOpen(false);
    setSearch('');
    setSelected([]);
    setError(null);
  };

  const handleAdd = async () => {
    if (!channelId || selected.length === 0 || addChannelMembers.isPending) return;
    try {
      await addChannelMembers.mutateAsync({ channelId, userIds: selected });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add members.');
    }
  };

  return (
    <Modal
      isOpen={addMembersModalOpen}
      onClose={handleClose}
      title="Add members"
      description={
        channel
          ? `Choose people to add to #${channel.name}.`
          : 'Choose people to add to this channel.'
      }
      maxWidth="md"
    >
      <div className="mt-4 space-y-4">
        <Input
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />

        <div className="panel-surface max-h-72 overflow-y-auto rounded-xl">
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          ) : candidates.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {search.trim()
                ? `No matches for “${search.trim()}”.`
                : 'Everyone in the workspace is already in this channel.'}
            </div>
          ) : (
            candidates.map((u, index) => {
              const isSelected = selected.includes(u.id);
              const isAgent = u.id.startsWith('usr-agent-');
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover-surface"
                  style={{
                    borderBottom:
                      index < candidates.length - 1 ? '1px solid var(--color-border)' : undefined,
                    background: isSelected ? 'var(--color-accent-muted)' : undefined,
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} src={u.avatarUrl} size="sm" status={u.status} showStatus />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {u.name}
                        </span>
                        {isAgent && (
                          <Badge variant="default" size="sm">
                            App
                          </Badge>
                        )}
                      </div>
                      <span className="truncate text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {u.title || u.email}
                      </span>
                    </div>
                  </div>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{
                      border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-accent)' : 'transparent',
                      color: isSelected ? '#fff' : 'transparent',
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              );
            })
          )}
        </div>

        {error && (
          <p className="text-xs" style={{ color: 'var(--color-danger, #f43f5e)' }}>
            {error}
          </p>
        )}

        <div
          className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={selected.length === 0 || addChannelMembers.isPending}
            onClick={() => void handleAdd()}
            className="gap-1.5"
          >
            {addChannelMembers.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            <span>
              Add{selected.length > 0 ? ` ${selected.length}` : ''}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
