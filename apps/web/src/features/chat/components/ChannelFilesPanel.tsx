import React from 'react';
import { FileText, Image as ImageIcon, Download, FolderOpen, Sparkles } from 'lucide-react';
import { useActiveMessages } from '../../../hooks';
import { Avatar } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';
import { resolveAssetUrl } from '../../../lib/assets';
import { chatService } from '../../../services';
import { useUiStore } from '../../../stores';

export const ChannelFilesPanel: React.FC = () => {
  const { messages, isLoading } = useActiveMessages();

  const files = messages.flatMap((msg) =>
    (msg.attachments || []).map((att) => ({
      ...att,
      messageId: msg.id,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      createdAt: msg.createdAt,
    })),
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Loading files…
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <FolderOpen className="mb-3 h-12 w-12 opacity-30" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          No files shared yet
        </p>
        <p className="mt-1 max-w-sm text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Files uploaded in this channel or direct message will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const isImg = file.type.startsWith('image/');
          return (
            <div
              key={`${file.messageId}-${file.id}`}
              className="flex flex-col overflow-hidden rounded-xl"
              style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
            >
              {isImg ? (
                <div className="relative h-32 w-full overflow-hidden" style={{ background: 'var(--color-input)' }}>
                  <img src={resolveAssetUrl(file.url)} alt={file.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  className="flex h-32 flex-col items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}
                >
                  <FileText className="h-10 w-10" style={{ color: 'var(--color-accent)' }} />
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    {file.name.split('.').pop()}
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  {isImg ? (
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  )}
                  <h4 className="truncate text-xs font-bold" style={{ color: 'var(--color-text-primary)' }} title={file.name}>
                    {file.name}
                  </h4>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {(file.size / 1024).toFixed(1)} KB • {formatTimestamp(file.createdAt)}
                </p>
                <div
                  className="mt-3 flex items-center justify-between border-t pt-2.5"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Avatar name={file.senderName} src={file.senderAvatar} size="xs" />
                    <span className="truncate text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {file.senderName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded p-1 transition-colors hover:bg-white/10"
                      title="Summarize file"
                      style={{ color: 'var(--color-accent)' }}
                      onClick={() => {
                        void chatService
                          .summarizeFileWithAi({ name: file.name, url: file.url, type: file.type })
                          .then((r) =>
                            useUiStore.getState().setError(`Summary (${file.name}): ${r.summary}`),
                          )
                          .catch((err) =>
                            useUiStore.getState().setError(err instanceof Error ? err.message : 'Summarize failed'),
                          );
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                    <a
                    href={resolveAssetUrl(file.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded p-1 transition-colors hover:bg-white/10"
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
    </div>
  );
};
