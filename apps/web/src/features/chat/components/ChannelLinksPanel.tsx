import React from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { useActiveMessages } from '../../../hooks';
import { Avatar } from '../../../components/ui';
import { formatTimestamp } from '../../../utils';

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

function extractLinks(messages: { id: string; content: string; senderName: string; senderAvatar?: string; createdAt: string }[]) {
  const seen = new Set<string>();
  const links: {
    url: string;
    messageId: string;
    senderName: string;
    senderAvatar?: string;
    createdAt: string;
  }[] = [];

  for (const msg of messages) {
    const matches = msg.content.match(URL_REGEX);
    if (!matches) continue;
    for (const url of matches) {
      const key = `${msg.id}:${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        url,
        messageId: msg.id,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        createdAt: msg.createdAt,
      });
    }
  }

  return links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function linkLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export const ChannelLinksPanel: React.FC = () => {
  const { messages, isLoading } = useActiveMessages();
  const links = extractLinks(messages);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Loading links…
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Link2 className="mb-3 h-12 w-12 opacity-30" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          No links shared yet
        </p>
        <p className="mt-1 max-w-sm text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          URLs posted in messages will appear here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-4">
      {links.map((link) => (
        <a
          key={`${link.messageId}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-xl p-3 transition-colors"
          style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-active-border)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)';
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-accent-muted)' }}
          >
            <Link2 className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {linkLabel(link.url)}
            </p>
            <p className="truncate text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {link.url}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Avatar name={link.senderName} src={link.senderAvatar} size="xs" />
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {link.senderName} • {formatTimestamp(link.createdAt)}
              </span>
            </div>
          </div>
          <ExternalLink
            className="h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </a>
      ))}
    </div>
  );
};
