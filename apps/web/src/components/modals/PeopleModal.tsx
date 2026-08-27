import React, { useState } from 'react';
import { Search, MessageSquare, Mail } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Modal, Avatar, Button, Input, Badge } from '../ui';

function isExactDm(participants: string[], a: string, b: string): boolean {
  const unique = Array.from(new Set(participants));
  if (a === b) {
    return unique.length === 1 && unique[0] === a;
  }
  return unique.length === 2 && unique.includes(a) && unique.includes(b);
}

export const PeopleModal: React.FC = () => {
  const [search, setSearch] = useState('');
  const { peopleModalOpen, setPeopleModalOpen, setActiveConversation } = useUiStore();
  const { users, currentUser, conversations } = useWorkspace();
  const { createConversation } = useChatMutations();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.title?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleStartDM = (userId: string) => {
    const existing = conversations.find((c) => isExactDm(c.participants, currentUser.id, userId));
    if (existing) {
      setActiveConversation(existing.id);
    } else {
      createConversation.mutate(userId);
    }
    setPeopleModalOpen(false);
    setSearch('');
  };

  const handleClose = () => {
    setPeopleModalOpen(false);
    setSearch('');
  };

  return (
    <Modal
      isOpen={peopleModalOpen}
      onClose={handleClose}
      title="People & Directory"
      description="Browse everyone in this workspace, check status, and start a direct message."
      maxWidth="lg"
    >
      <div className="mt-4 space-y-4">
        <Input
          placeholder="Filter by name, role, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />

        <div className="panel-surface max-h-80 overflow-y-auto rounded-xl">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              No people match “{search.trim() || 'your filter'}”.
            </div>
          ) : (
            filtered.map((u, index) => {
              const isMe = u.id === currentUser.id;
              const isAgent = u.id.startsWith('usr-agent-');
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 transition-colors hover-surface"
                  style={{
                    borderBottom:
                      index < filtered.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} src={u.avatarUrl} size="md" status={u.status} showStatus />
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-theme-primary">{u.name}</span>
                        {isMe && (
                          <Badge variant="primary" size="sm">
                            You
                          </Badge>
                        )}
                        {isAgent && (
                          <Badge variant="default" size="sm">
                            App
                          </Badge>
                        )}
                      </div>
                      <span className="truncate text-[11px] text-theme-secondary">
                        {u.title || u.email}
                      </span>
                      {u.statusMessage && (
                        <span
                          className="mt-0.5 truncate text-[10px] italic"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          &ldquo;{u.statusMessage}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isMe && (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleStartDM(u.id)}
                        className="gap-1 text-xs"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Message</span>
                      </Button>
                    )}
                    {!isAgent && (
                      <a
                        href={`mailto:${u.email}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover-surface"
                        style={{
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-input)',
                          color: 'var(--color-text-secondary)',
                        }}
                        aria-label={`Email ${u.name}`}
                      >
                        <Mail className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
