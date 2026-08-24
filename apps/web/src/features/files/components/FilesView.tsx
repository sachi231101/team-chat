import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Search,
  FolderOpen,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useUiStore } from '../../../stores';
import { useWorkspace, useActiveMessages } from '../../../hooks';
import { Avatar } from '../../../components/ui';

type FileFilter = 'all' | 'images' | 'documents' | 'media';

export const FilesView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const { setActiveChannel } = useUiStore();
  const { channels } = useWorkspace();
  const { messages } = useActiveMessages();

  // Aggregate all attachments from all messages
  const allFiles = messages.flatMap((msg) =>
    (msg.attachments || []).map((att) => ({
      ...att,
      messageId: msg.id,
      channelId: msg.channelId,
      conversationId: msg.conversationId,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      createdAt: msg.createdAt,
    })),
  );

  const filesList = allFiles;

  const filteredFiles = filesList.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'images') return file.type.startsWith('image/');
    if (activeFilter === 'documents') return !file.type.startsWith('image/');
    return true;
  });

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      {/* Header */}
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Files Browser
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-secondary)' }}
          >
            {filteredFiles.length} files
          </span>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search files by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none"
            style={{
              background: 'var(--color-input)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 px-6 py-2"
        style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-header)' }}
      >
        {(['all', 'images', 'documents', 'media'] as FileFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all"
            style={{
              background: activeFilter === tab ? 'var(--color-accent-muted)' : 'transparent',
              color: activeFilter === tab ? '#ffffff' : 'var(--color-text-secondary)',
              border: activeFilter === tab ? '1px solid var(--color-active-border)' : '1px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid of Files */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="h-12 w-12 opacity-30 mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              No files found
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Files shared in channels and direct messages will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const isImg = file.type.startsWith('image/');
              const channel = channels.find((c) => c.id === file.channelId);

              return (
                <div
                  key={file.id}
                  className="group relative flex flex-col rounded-xl overflow-hidden transition-all hover:scale-101 shadow-md"
                  style={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Preview Banner */}
                  {isImg ? (
                    <div
                      className="h-32 w-full flex items-center justify-center relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                      }}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover opacity-80 mix-blend-overlay"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-32 w-full flex flex-col items-center justify-center relative"
                      style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                      }}
                    >
                      <FileText className="h-10 w-10" style={{ color: 'var(--color-accent)' }} />
                      <span className="mt-2 text-[10px] uppercase tracking-wider font-bold text-indigo-300">
                        {file.name.split('.').pop()}
                      </span>
                    </div>
                  )}

                  {/* Metadata Content */}
                  <div className="flex flex-col p-3 flex-1 justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {isImg ? (
                          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                        )}
                        <h4
                          className="text-xs font-bold truncate flex-1"
                          style={{ color: 'var(--color-text-primary)' }}
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                      </div>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {(file.size / (1024 * 1024)).toFixed(1)} MB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </div>

                    {/* Shared by & actions */}
                    <div className="mt-3 pt-2.5 flex items-center justify-between border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar name={file.senderName} src={file.senderAvatar} size="xs" />
                        <span className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {file.senderName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {channel && (
                          <button
                            onClick={() => setActiveChannel(channel.id)}
                            className="p-1 rounded transition-colors hover:bg-white/10"
                            title={`Jump to #${channel.name}`}
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded transition-colors hover:bg-white/10"
                          title="Download file"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
