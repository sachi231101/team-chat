import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Tooltip } from '../ui';
import { CatchMeUpPanel } from './CatchMeUpPanel';

interface SummarizeMenuProps {
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
  /** Optional label override for thread vs channel */
  title?: string;
}

/**
 * Header entry for Slack-style “Catch me up”.
 * Opens a side panel with time-range summary, citations, copy/post/dismiss.
 */
export const SummarizeMenu: React.FC<SummarizeMenuProps> = ({
  channelId,
  conversationId,
  parentMessageId,
  title,
}) => {
  const [open, setOpen] = useState(false);
  const disabled = !channelId && !conversationId && !parentMessageId;

  return (
    <>
      <Tooltip content={disabled ? 'Open a chat to catch up' : 'Catch me up'} side="bottom">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Catch me up"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </Tooltip>
      <CatchMeUpPanel
        open={open}
        onClose={() => setOpen(false)}
        channelId={channelId}
        conversationId={conversationId}
        parentMessageId={parentMessageId}
        title={title}
      />
    </>
  );
};
