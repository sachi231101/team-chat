import React, { useState } from 'react';
import { Search, MessageSquare, Mail } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Modal, Avatar, Button, Input, Badge } from '../ui';

export const PeopleModal: React.FC = () => {
  const [search, setSearch] = useState('');
  const {
    peopleModalOpen,
    setPeopleModalOpen,
    users,
    currentUser,
    setActiveConversation,
    conversations,
  } = useChatDataStore();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.title?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleStartDM = (userId: string) => {
    // Find or create conversation ID
    const existing = conversations.find(
      (c) => c.participants.includes(userId) && c.participants.includes(currentUser.id),
    );
    if (existing) {
      setActiveConversation(existing.id);
    }
    setPeopleModalOpen(false);
  };

  return (
    <Modal
      isOpen={peopleModalOpen}
      onClose={() => setPeopleModalOpen(false)}
      title="People & Directory"
      description="Browse all colleagues in the workspace, check status, and start direct conversations."
      maxWidth="lg"
    >
      <div className="mt-4 space-y-4">
        <Input
          placeholder="Filter by name, role, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
          {filtered.map((u) => {
            const isMe = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} src={u.avatarUrl} size="md" status={u.status} showStatus />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{u.name}</span>
                      {isMe && <Badge variant="primary" size="sm">You</Badge>}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">{u.title}</span>
                    {u.statusMessage && (
                      <span className="text-[10px] text-indigo-300 italic truncate mt-0.5">
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
                  <a
                    href={`mailto:${u.email}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Mail className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
